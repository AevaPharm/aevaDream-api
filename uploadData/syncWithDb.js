const mongoose = require("mongoose")
const MAX_CHUNK_SIZE = 12 * 1024 * 1024;  // 10 MB

function splitArrayIntoChunks(dataArray) {
    let chunks = [];
    let currentChunk = [];
    let currentChunkSize = 0;

    for (const item of dataArray) {
        const itemSize = Buffer.from(JSON.stringify([item])).length;
        if (currentChunkSize + itemSize < MAX_CHUNK_SIZE) {
            currentChunk.push(item);
            currentChunkSize += itemSize;
        } else {
            chunks.push(currentChunk);
            currentChunk = [item];
            currentChunkSize = itemSize;
        }
    }

    if (currentChunk.length) {
        chunks.push(currentChunk);
    }

    return chunks;
}

async function updateOrInsertPatients(newPatients) {
    const collection = mongoose.connection.collection("patients")
    const operations = []
    
    for(const identifier in newPatients) {
        const existingPatient = await collection.findOne({identifier})
        const newPatientData = newPatients[identifier]

        if(existingPatient) {
            const toInactive = Object.keys(newPatientData.inactivePrescriptions).filter(rx => existingPatient.activePrescriptions.hasOwnProperty(rx))
            
            const toActive = Object.keys(newPatientData.activePrescriptions).filter(rx => existingPatient.inactivePrescriptions.hasOwnProperty(rx))

            const updatedInactivePrescriptions = {
                ...existingPatient.inactivePrescriptions,
                ...toInactive.reduce((obj, rx) => {
                    obj[rx] = newPatientData.inactivePrescriptions[rx]
                    return obj
                }, {})
            }

            const updatedActivePrescriptions = {
                ...existingPatient.activePrescriptions,
                ...newPatientData.activePrescriptions,
                ...toActive.reduce((obj, rx) => {
                    obj[rx] = newPatientData.activePrescriptions[rx]
                    return obj
                }, {})
            }

            toInactive.forEach(rx => delete updatedActivePrescriptions[rx])
            toActive.forEach(rx => delete updatedInactivePrescriptions[rx])

            operations.push({
                updateOne: {
                    filter: {identifier},
                    update: {
                        $set: {
                            inactivePrescriptions: updatedInactivePrescriptions,
                            activePrescriptions: updatedActivePrescriptions
                        }
                    },
                    upsert: true
                }
            })
        } else {
            operations.push({
                insertOne: {document: newPatientData}
            })
        }
    }
    await collection.bulkWrite(operations, {ordered: false})
}

async function updateOrInsertPrescriptions(newPrescriptions) {
    const collection = mongoose.connection.collection("prescriptions")
    const chunks = splitArrayIntoChunks(newPrescriptions)

    for(const chunk of chunks) {
        const operations = chunk.map(prescription => ({
            updateOne: {
                filter: {identifier: prescription.identifier},
                update: {$set: prescription},
                upsert: true
            }
        }))

        try {
            await collection.bulkWrite(operations, {ordered: false})
        } catch(error) {
            if(error.code !== 11000) {
                throw error
            }
        }
    }
    return "success"
}

// Utility to chunk large objects
function chunkObject(obj) {
    const maxChunkSize = MAX_CHUNK_SIZE
    let chunks = [];
    let currentChunk = {};
    let currentChunkSize = 0;

    for (const key in obj) {
        const itemSize = Buffer.from(JSON.stringify({ [key]: obj[key] })).length;

        if (currentChunkSize + itemSize < maxChunkSize) {
            currentChunk[key] = obj[key];
            currentChunkSize += itemSize;
        } else {
            chunks.push(currentChunk);
            currentChunk = { [key]: obj[key] };
            currentChunkSize = itemSize;
        }
    }

    if (Object.keys(currentChunk).length) {
        chunks.push(currentChunk);
    }

    return chunks;
}

// async function uploadQueueData(data) {
//     const collection = mongoose.connection.collection('queues')
//     const { department, queue, newData } = data

//     const chunks = chunkObject(newData)
//     for(let chunk of chunks) {
//         let today = new Date().toLocaleDateString('en-US', {year: 'numeric', month: '2-digit', day: '2-digit'})
//         try {
//             if(department === "callCenter" && queue === "queue") {
//                 for(const language in chunk) {
//                     const operations = Object.entries(chunk[language]).map(([identifier, prescriptionIdentifiers]) => {
//                         return [
//                             // create the language queue if it does not exist
//                             {
//                                 updateOne: {
//                                     filter: {
//                                         department,
//                                         [`queues.${queue}.${language}`]: { $exists: false }
//                                     },
//                                     update: {
//                                         $set: { [`queues.${queue}.${language}`]: {} }
//                                     }
//                                 }
//                             },
//                             // update prescriptions if patientIdentifier exists on the language queue
//                             {
//                                 updateOne: {
//                                     filter: {
//                                         department,
//                                         [`queues.${queue}.${language}.${identifier}`]: { $exists: true }
//                                     },
//                                     update: {
//                                         $addToSet: { [`queues.${queue}.${language}.${identifier}`]: {$each: prescriptionIdentifiers}}
//                                     }
//                                 }
//                             },
//                             // create entry if patientIdentifier does not exist
//                             {
//                                 updateOne: {
//                                     filter: {
//                                         department,
//                                         [`queues.${queue}.${language}.${identifier}`]: { $exists: false }
//                                     },
//                                     update: {
//                                         $set: { [`queues.${queue}.${language}.${identifier}`]: prescriptionIdentifiers }
//                                     }
//                                 }
//                             }
//                         ]
//                     })
//                     await collection.bulkWrite(operations.flat())
//                 }
//             } else {
//                 const operations = Object.entries(chunk).map(([identifier, prescriptionIdentifiers]) => {
//                     return [
//                         {
//                             updateOne: {
//                                 filter: {
//                                     department,
//                                     [`queues.${queue}.${identifier}`]: { $exists: true }
//                                 },
//                                 update: {
//                                     $addToSet: { [`queues.${queue}.${identifier}`]: { $each: prescriptionIdentifiers } }
//                                 }
//                             }
//                         },
//                         // create new entry if patient identifier does not exist
//                         {
//                             updateOne: {
//                                 filter: {
//                                     department,
//                                     [`queues.${queue}.${identifier}`]: { $exists: false }
//                                 },
//                                 update: {
//                                     $set: { [`queues.${queue}.${identifier}`]: prescriptionIdentifiers }
//                                 }
//                             }
//                         }
//                     ]
//                 })
//                 await collection.bulkWrite(operations.flat())
//             }
//         } catch(err) {
//             throw new Error(err.message)
//         }
//     }
// }

async function uploadQueueData(data) {
    const { department, queue, newData } = data;
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });

    try {
        const collection = mongoose.connection.collection("queues");
        const departmentQueueData = await collection.findOne({ department });
        
        if (!departmentQueueData) {
            console.error(`No document found for department: ${department}`);
            return;
        }

        const existingQueueData = departmentQueueData.queues[queue] || [];

        for(const [identifier, prescriptionIdentifiers] of Object.entries(newData)) {
            let existingDateIndex = existingQueueData.findIndex(item => item.date === today);
            
            if(existingDateIndex === -1) {
                let newQueueItem = {
                    date: today,
                    count: prescriptionIdentifiers.length,
                    data: {
                        [identifier]: prescriptionIdentifiers
                    }
                };

                // Find the index to insert the new item based on the date.
                let insertIndex = existingQueueData.findIndex(item => new Date(item.date) > new Date(today));
                if(insertIndex === -1) {
                    // Just push if no later date is found.
                    existingQueueData.push(newQueueItem);
                } else {
                    // Insert the item at the found index.
                    existingQueueData.splice(insertIndex, 0, newQueueItem);
                }

            } else {
                let currentQueueItem = existingQueueData[existingDateIndex];
                
                if(!currentQueueItem.data[identifier]) {
                    currentQueueItem.data[identifier] = prescriptionIdentifiers;
                    currentQueueItem.count += prescriptionIdentifiers.length;
                } else {
                    let currentPrescriptions = new Set(currentQueueItem.data[identifier]);
                    let startingSize = currentPrescriptions.size;
                    
                    prescriptionIdentifiers.forEach(identifier => currentPrescriptions.add(identifier));
                    
                    let endingSize = currentPrescriptions.size;
                    currentQueueItem.data[identifier] = [...currentPrescriptions];
                    let numberAdded = endingSize - startingSize;
                    currentQueueItem.count += numberAdded;
                }
            }
        }
        departmentQueueData.queues[queue] = existingQueueData;
        await collection.updateOne({ department }, { $set: { queues: departmentQueueData.queues } });

        console.log("Data successfully updated in the database.");

    } catch(err) {
        console.error("Error in uploadQueueData:", err.message);
    }
}







// The chunkObject function is used in the code but not provided. Ensure that this function is defined and behaves as expected in your environment.


// async function uploadQueueData(data) {
//     const collection = mongoose.connection.collection('queues')
//     console.log("calling upload queue data with the following", data)
//     const { department, queue, newData } = data

//     const chunks = chunkObject(newData)
//     let today = new Date().toLocaleDateString('en-US', {year: 'numeric', month: '2-digit', day: '2-digit'})

//     for (let chunk of chunks) {
//         try {
//             const baseQueuePath = `queues.${queue}`
//             let operations = []

//             const handleLanguage = (language, chunkData) => {
//                 for (const [identifier, prescriptionIdentifiers] of Object.entries(chunkData)) {
//                     const todayPath = `${baseQueuePath}.$[todayElem].data.${identifier}`

//                     operations.push({
//                         updateOne: {
//                             filter: { department },
//                             update: {
//                                 $addToSet: { [`${todayPath}`]: { $each: prescriptionIdentifiers } },
//                                 $inc: { [`${todayPath}.count`]: prescriptionIdentifiers.length }
//                             },
//                             arrayFilters: [{ "todayElem.date": today }]
//                         }
//                     })
//                 }
//             }

//             if (department === "callCenter" && queue === "queue") {
//                 for (const language of ['English', 'Spanish']) {
//                     if (chunk[language]) handleLanguage(language, chunk[language])
//                 }
//             } else {
//                 handleLanguage(null, chunk);
//             }

//             await collection.bulkWrite(operations)

//         } catch (err) {
//             throw new Error(err.message)
//         }
//     }
// }


// async function uploadQueueData(data) {
//     const collection = mongoose.connection.collection('queues');
//     const { department, queue, newData } = data;

//     const chunks = chunkObject(newData);

//     let today = new Date().toLocaleDateString('en-US', {year: 'numeric', month: '2-digit', day: '2-digit'});
    
//     const getUpdateOperations = (chunk, queueData, isCallCenter = false) => {
//         const operations = [];

//         const todayIndex = queueData ? queueData.queue.findIndex(entry => entry.date === today) : -1;

//         const handleLanguage = (language, chunkData) => {
//             if (todayIndex !== -1) {
//                 for (const [identifier, prescriptionIdentifiers] of Object.entries(chunkData)) {
//                     const dataPath = isCallCenter ? 
//                         `queues.${queue}.${todayIndex}.${language}.data.${identifier}` : 
//                         `queues.${queue}.${todayIndex}.data.${identifier}`;
                    
//                     if (queueData.queue[todayIndex].data[identifier]) {
//                         operations.push({
//                             updateOne: {
//                                 filter: {
//                                     department,
//                                     [dataPath]: { $exists: true }
//                                 },
//                                 update: {
//                                     $addToSet: { [dataPath]: { $each: prescriptionIdentifiers } },
//                                     $inc: { [dataPath.replace('.data.', '.count.')]: prescriptionIdentifiers.length }
//                                 }
//                             }
//                         });
//                     } else {
//                         operations.push({
//                             updateOne: {
//                                 filter: { department },
//                                 update: {
//                                     $set: { [dataPath]: prescriptionIdentifiers },
//                                     $inc: { [dataPath.replace('.data.', '.count.')]: prescriptionIdentifiers.length }
//                                 }
//                             }
//                         });
//                     }
//                 }
//             } else {
//                 let newEntry = {
//                     date: today,
//                     count: 0,
//                     data: {}
//                 };
//                 if (isCallCenter) {
//                     newEntry[language] = {
//                         count: 0,
//                         data: {}
//                     };
//                 }

//                 for (const [identifier, prescriptionIdentifiers] of Object.entries(chunkData)) {
//                     const target = isCallCenter ? newEntry[language] : newEntry;
//                     target.data[identifier] = prescriptionIdentifiers;
//                     target.count += prescriptionIdentifiers.length;
//                 }

//                 operations.push({
//                     updateOne: {
//                         filter: { department },
//                         update: {
//                             $push: {
//                                 queue: {
//                                     $each: [newEntry],
//                                     $position: todayIndex === 0 ? 0 : todayIndex + 1
//                                 }
//                             }
//                         }
//                     }
//                 });
//             }
//         }

//         if (isCallCenter) {
//             for (const language of ['English', 'Spanish']) {
//                 if (chunk[language]) handleLanguage(language, chunk[language]);
//             }
//         } else {
//             handleLanguage(null, chunk);
//         }

//         return operations;
//     }

//     try {
//         const queueData = await collection.findOne({ department });
        
//         for (let chunk of chunks) {
//             let operations = [];

//             if (department === "callCenter" && queue === "queue") {
//                 operations = [...operations, ...getUpdateOperations(chunk, queueData, true)];
//             } else {
//                 operations = [...operations, ...getUpdateOperations(chunk, queueData)];
//             }

//             if (operations.length > 0) {
//                 await collection.bulkWrite(operations);
//             }
//         }
//     } catch (err) {
//         throw new Error(err.message);
//     }
// }



module.exports = { updateOrInsertPatients, updateOrInsertPrescriptions, uploadQueueData }