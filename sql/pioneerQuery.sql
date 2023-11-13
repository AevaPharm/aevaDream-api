SELECT
	-- prescription
	rx.RxID AS 'prescriptionId',
	rx.RxNumber AS 'rxNumber',
	rx.AvailableForFillDate as 'availableForFill',
	CASE
		WHEN rx.SerialNumberNarcotic IS NOT NULL
		OR rx.SerialNumberControlled IS NOT NULL THEN 'true'
		ELSE 'false'
	END AS 'controlled',
	convert(char(10),rxt.ChangedOn,101) as 'transactionStatusDate',
	CEILING(rxt.DispensedQuantity) AS 'dispensedQuantity',
	CASE
		WHEN rx.PrescribedItemID IS NOT NULL THEN item.ItemName
		WHEN rx.MedicationID IS NOT NULL THEN catalog.MedicationDescription
		WHEN rx.PrescribedIvID IS NOT NULL THEN 'IV'
	END AS 'prescribedItem',
	convert(char(10), rx.DateWritten, 101) AS 'dateWritten',
	convert(char(10), rx.ExpirationDate, 101) AS 'expirationDate',
	rxstat.RxStatusTypeText AS 'rxStatus',
	rx.NumberofRefillsAllowed AS 'totalRefills',
	CEILING(rx.NumberOfRefillsAllowed - rx.NumberOfRefillsFilled) AS 'refillsRemaining',
	CEILING(rx.Quantity) AS 'quantityWritten',
	rxOrigin.OriginTypeText as 'origin',
	rx.DirectionsTranslated AS 'directions',
	rx.DirectionsTranslatedSpanish AS 'directionsSpanish',
	readonly.StripRichTextFormat(rx.CriticalComment) AS 'prescriptionCriticalComment',
	readonly.StripRichTextFormat(rx.InformationalComment) AS 'prescriptionInformationalComment',
	rx.RecommendedDaysSupply AS 'daySupply',
	FORMAT(rx.DaysSupplyEndsOn, 'MM/dd/yyyy') AS 'daySupplyEndsOn',
	CEILING(rx.RxTotalQuantityRemaining) AS 'totalQuantityRemaining',
	CASE
		WHEN rx.ActiveQueueCount <> 0 THEN 'true'
		ELSE 'false'
	END AS 'prescriptionActiveInQueue',
	FORMAT(rx.CounseledOn, 'MM/dd/yyyy') AS 'counceledOn',
	CASE
		WHEN rx.CounseledByPharmacistID IS NOT NULL THEN counselingPharmacist.FirstName + ' ' + counselingPharmacist.LastName
		ELSE NULL
	END AS 'counceledBy',
	FORMAT(rx.RenewLastSentOn, 'MM/dd/yyyy') AS 'renewalSentDate',
	rx.RenewRequestComment AS 'renewalComment',
	rx.RenewSentCount AS 'renewalsSent',
	renewalSentTo.PrintName AS 'renewalSentTo',
	CEILING(item.StockSize) AS 'amountInStock',
	item.Strength AS 'strength',
	type.ItemTypeText AS 'prescriptionType',
	CASE 
        WHEN item.IsSoldOTC = '1' THEN 'true'
        ELSE 'false'
    END AS 'soldOTC',
	CASE
		WHEN rx.PreCheckNeededTypeID = '1' THEN 'true'
		ELSE 'false'
	END AS 'needsPreCheck',
	primaryTP.ThirdPartyName AS 'primaryInsurer',
	secondaryTP.ThirdPartyName AS 'secondaryInsurer',
	dItem.NDC as 'ndc',
	isnull(primaryPPMTP.GroupNumber,'') AS 'primaryGroupNumber',
	primaryTP.BIN AS 'primaryThirdPartyBin',
	secondaryTP.BIN as 'secondaryThirdPartyBin',
	ISNULL(marketer.FirstName+ ' ', '') + ISNULL(marketer.LastName+ ' ', '')  AS 'marketerName',
	rx.RenewedFromRxID AS 'renewedFrom',
	rx.RenewedPrescriptionID AS 'newRenewal',

	-- prescription transaction
	rxtStatus.RxTransactionStatusTypeText AS 'rxTransactionStatus',
	case when rxt.RefillNumber > 0 then 'Refill' else 'New' end as 'refillOrNew',
	rxt.CompletedDate as 'completedOn',
	ISNULL(checkedBy.Salutation+ ' ','') +  ISNULL(checkedBy.FirstName+ ' ', '') + ISNULL(checkedBy.LastName+ ' ', '') + ISNULL(', ' + checkedBy.Suffix, '') AS 'checkedBy',
	rxt.CheckedOn as 'checkedOn',
	ISNULL(filledBy.Salutation+ ' ','') +  ISNULL(filledBy.FirstName+ ' ', '') + ISNULL(' ' + filledBy.MiddleName+ ' ', '') + ISNULL(filledBy.LastName+ ' ', '') + ISNULL(', ' + filledBy.Suffix, '') AS 'filledBy',
	CAST(FORMAT(rxt.FilledOn, 'g') AS DATETIME) AS 'filledOn',
	ISNULL(pharmacist.Salutation+ ' ', '') + ISNULL(pharmacist.FirstName+ ' ', '') + ISNULL(pharmacist.LastName+ ' ', '') + ISNULL(pharmacist.Suffix, '') AS 'pharmacist',
	

	-- payment
	CASE WHEN primaryPPMT.PayMethodTypeText IS NOT NULL THEN primaryPPMT.PayMethodTypeText
		WHEN workersComp.PatientWorkersCompID IS NOT NULL THEN 'Workers Comp'
		ELSE 'Cash'
	END as 'patientPayMethod',
	rxt.IngredientCostSubmitted AS 'ingredientCost',
	rxt.IngredientCostPaid AS 'ingredientCostPaid',
	rxt.DispensingFeeSubmitted AS 'dispensingFee',
	rxt.DispensingFeePaid AS 'dispensingFeePaid',
	rxt.TotalPriceSubmitted AS 'totalPrice',
	rxt.TotalPricePaid AS 'totalPricePaid',
	rxt.PatientPaidAmount AS 'patientPaidAmount',
	rxt.AcquisitionCost AS 'acquisitionCost',
	isnull(rxt.TotalPricePaid,0) - isnull(rxt.AcquisitionCost,0) as 'grossProfit',
	CASE WHEN rxtStatus.RemoveFromInventory = 1 AND (rxt.IsTransfer = 0 OR rxt.IsTransfer IS NULL)
				THEN CONVERT(DECIMAL(18,2), COALESCE(rxt.TotalPricePaid, 0)) 
						- CONVERT(DECIMAL(18,2), COALESCE(rxt.TaxAmountPaid, 0))
						- CONVERT(DECIMAL(18,2), COALESCE(rxt.RebateCost, rxt.AcquisitionCost, 0)) 
						- CONVERT(DECIMAL(18,2), COALESCE(rxt.DirFeeTotal, 0))
				ELSE 0.00
		END AS 'netProfit',
	
	-- claim
	primaryLtrans.ResponseMessage AS 'primaryClaimMessage',
	secondaryLtrans.ResponseMessage AS 'secondaryClaimMessage',

	-- patient
	rx.PatientID AS 'patientId',
	'[' + STUFF(
        (SELECT ', "' + readonly.StripRichTextFormat(allergies.AllergenDescription) + '"'
         FROM Person.PatientAllergy allergies
         WHERE pt.PersonID = allergies.PersonID
         FOR XML PATH('')), 1, 2, '') + ']' AS 'allergies',
	CASE
		WHEN pt.AllergyStatusTypeID != '2' THEN 'true'
		ELSE 'false'
	END AS 'reviewAllergies',
	CASE
		WHEN pt.MedConditionStatusTypeID = 1 THEN 'true'
		ELSE 'false'
	END AS 'reviewMedConditions',
	CASE 
		WHEN patientStatus.IsActive != '1' THEN 'inactive'
		ELSE 'active'
	END AS 'customerStatus',
	ISNULL(patientInfo.FirstName+ ' ', '') 
		+ ' ' 
		+ISNULL(patientInfo.MiddleName+ ' ', '') 
		+ ' ' 
		+ISNULL(patientInfo.LastName+ ' ', '') 
		+ ' ' 
		+ISNULL(patientInfo.Suffix, '') 
		AS 'patientName',
	language.LanguageTypeText AS 'patientPreferredLanguage',
	patientInfo.Gender AS 'gender',
	FORMAT(patientInfo.DateOfBirth, 'MM/dd/yyyy') AS 'patientDob',
	readonly.StripRichTextFormat(readonly.DecryptData(patientInfo.CriticalComment)) AS 'patientCriticalComment',
	readonly.StripRichTextFormat(readonly.DecryptData(patientInfo.InformationalComment)) AS 'patientAdditionalComment',
	patientPhone.PhoneNumber + ISNULL(' Ext: ' + patientPhone.Extension, '') AS 'patientPhone',
	CONCAT(
		'{',
		'"primary":{',
        '"street":"', COALESCE(readonly.StripRichTextFormat(primaryAddress.Address), ''), '",',
        '"city":"', COALESCE(readonly.StripRichTextFormat(primaryAddress.City), ''), '",',
        '"state":"', COALESCE(readonly.StripRichTextFormat(primaryAddress.StateCode), ''), '",',
        '"zip":"', COALESCE(readonly.StripRichTextFormat(primaryAddress.ZipCode), ''), '"',
		'},',
		'"delivery":{',
        '"street":"', COALESCE(readonly.StripRichTextFormat(deliveryAddress.Address), ''), '",',
        '"city":"', COALESCE(readonly.StripRichTextFormat(deliveryAddress.City), ''), '",',
        '"state":"', COALESCE(readonly.StripRichTextFormat(deliveryAddress.StateCode), ''), '",',
        '"zip":"', COALESCE(readonly.StripRichTextFormat(deliveryAddress.ZipCode), ''), '"',
		'}',
		'}'
	) AS 'patientAddresses',

	-- prescriber
	prescriber.PrintName AS 'prescriber',
	prescriber.DEA AS 'prescriberDEA',
	prescriber.NPI AS 'prescriberNPI',
	CONCAT(
		'{',
		'"street":"', COALESCE(readonly.StripRichTextFormat(prescriberAddress.Address), ''), '",',
		'"city":"', COALESCE(readonly.StripRichTextFormat(prescriberAddress.City), ''), '",',
		'"state":"', COALESCE(readonly.StripRichTextFormat(prescriberAddress.StateCode), ''), '",',
		'"zip":"', COALESCE(readonly.StripRichTextFormat(prescriberAddress.ZipCode), ''), '"',
		'}'
	) AS 'prescriberAddress',
	prescriberPhone.PhoneNumber AS 'prescriberPhone',
	prescriberFax.PhoneNumber AS 'prescriberFax'
	
	FROM Prescription.Rx rx
	-- prescription
	JOIN Prescription.RxTransaction rxt ON rx.RxID = rxt.RxID
	LEFT JOIN Prescription.RxStatusType rxstat WITH (NOLOCK)ON rx.RxStatusTypeID = rxstat.RxStatusTypeID
	LEFT JOIN Prescription.OriginType rxOrigin WITH (NOLOCK) ON rx.OriginTypeID = rxOrigin.OriginTypeID
	LEFT JOIN Prescription.RxTransactionStatusType rxtStatus WITH (NOLOCK) ON rxt.RxTransactionStatusTypeID = rxtStatus.RxTransactionStatusTypeID
	LEFT JOIN PioneerRxCatalog.API.MedMedicationView catalog WITH (NOLOCK) ON rx.MedicationID = catalog.MedicationID
	LEFT JOIN Person.Person pharmacist WITH (NOLOCK) ON rxt.PharmacistID = pharmacist.PersonID
	LEFT JOIN Person.Person filledBy WITH (NOLOCK) ON rxt.FilledBy = filledBy.PersonID
LEFT JOIN Person.Person prechecked WITH (NOLOCK) ON rxt.PrecheckedBy = prechecked.PersonID
LEFT JOIN Person.Person checkedBy WITH (NOLOCK)ON rxt.CheckedBy = checkedBy.PersonID
LEFT JOIN Prescription.RxTransactionWorkFlow rtw WITH (NOLOCK) ON rtw.RxTransactionWorkFlowID = rxt.RxTransactionWorkFlowIDCurrent
					AND rtw.RxTransactionStatusTypeID = '89E74AE1-99C7-4A28-A628-73E556D10FB1'--RxTransactionStatus of Completed
LEFT JOIN Person.Person completedBy WITH(NOLOCK) ON completedBy.PersonID = rtw.StageCompletedBy
	-- item
	LEFT JOIN Item.Item item WITH (NOLOCK) ON rx.PrescribedItemID = item.ItemID
	LEFT JOIN Item.Item dItem WITH (NOLOCK)ON rxt.DispensedItemID = dItem.ItemID
	LEFT JOIN Item.ItemType type ON item.ItemTypeID = type.ItemTypeID
	-- person
	LEFT JOIN Person.Person counselingPharmacist WITH (NOLOCK) ON rx.CounseledByPharmacistID = counselingPharmacist.PersonID
	-- prescriber
	LEFT JOIN Person.Prescriber renewalSentTo WITH (NOLOCK) ON rx.PrescriberIDRenewSentTo = renewalSentTo.PersonID
	LEFT JOIN Person.Prescriber prescriber WITH (NOLOCK) ON rx.WrittenByID = prescriber.PersonID
	LEFT JOIN Person.Person prescriberInfo WITH (NOLOCK) ON rx.WrittenByID = prescriberInfo.PersonID
	LEFT JOIN Person.PersonAddress prescriberAddress WITH (NOLOCK) ON prescriberInfo.PrimaryAddressID = prescriberAddress.AddressID
	LEFT JOIN Person.PersonPhone prescriberPhone WITH (NOLOCK) ON prescriberInfo.PrimaryPhoneID = prescriberPhone.PhoneID
	LEFT JOIN Person.PersonPhone prescriberFax WITH (NOLOCK) ON prescriberInfo.PrimaryFaxID = prescriberFax.PhoneID
	LEFT JOIN Person.Person marketer WITH (NOLOCK) ON prescriber.MarketerID = marketer.PersonID
	-- patient
	LEFT JOIN Person.Patient pt WITH(NOLOCK) ON rx.PatientID = pt.PersonID
	LEFT JOIN Person.StatusTypePatient patientStatus WITH (NOLOCK) ON pt.StatusTypePatientID = patientStatus.StatusTypePatientID
	LEFT JOIN Person.Person patientInfo WITH (NOLOCK) ON pt.PersonID = patientInfo.PersonID
	LEFT JOIN Person.LanguageType language WITH (NOLOCK) ON patientInfo.LanguageTypeID = language.LanguageTypeID
	LEFT JOIN Person.PersonAddress primaryAddress WITH (NOLOCK) ON patientInfo.PrimaryAddressID = primaryAddress.AddressID
	LEFT JOIN Person.PersonAddress deliveryAddress WITH (NOLOCK) ON patientInfo.DeliveryAddressID = deliveryAddress.AddressID
	LEFT JOIN Person.PersonPhone patientPhone WITH (NOLOCK) ON patientInfo.PrimaryPhoneID = patientPhone.PhoneID
	-- payment
	LEFT JOIN Person.PatientPayMethod primaryPPM WITH (NOLOCK) ON rxt.PrimaryPatientPayMethodID = primaryPPM.PatientPayMethodID
	LEFT JOIN Person.PatientPayMethodType primaryPPMT WITH (NOLOCK) ON primaryPPM.PayMethodTypeID = primaryPPMT.PayMethodTypeID
	LEFT JOIN Person.PatientWorkersComp workersComp WITH (NOLOCK) ON rxt.PrimaryPatientPayMethodID = workersComp.PatientWorkersCompID
	LEFT JOIN Person.PatientWorkersCompThirdParty workersCompTp WITH (NOLOCK) ON workersCompTp.PatientWorkersCompID = workersComp.PatientWorkersCompID
	LEFT JOIN Prescription.RxTransactionPatientPayMethod rxtPrimaryPPM WITH (NOLOCK) ON rxtPrimaryPPM.PatientPayMethodID = rxt.PrimaryPatientPayMethodID 
														AND rxtPrimaryPPM.RxTransactionID = rxt.RxTransactionID
	LEFT JOIN Prescription.ThirdPartyPaidStatusType primaryPaidStat WITH (NOLOCK) ON rxtPrimaryPPM.ThirdPartyPaidStatusTypeID = primaryPaidStat.ThirdPartyPaidStatusTypeID
	LEFT JOIN Person.PatientPayMethodThirdParty primaryPPMTP WITH (NOLOCK) ON primaryPPMTP.PatientPayMethodID = rxt.PrimaryPatientPayMethodID
	LEFT JOIN Person.Person primarycardholderPt  WITH (NOLOCK) ON primarycardholderPt.PersonID = primaryPPMTP.CardholderPersonID
	LEFT JOIN ThirdParty.ThirdParty primaryTP WITH (NOLOCK) ON COALESCE(
															  workersCompTp.ThirdPartyID,
															  primaryPPMTP.ThirdPartyID
															  ) = primaryTP.ThirdPartyID
	LEFT JOIN ThirdParty.TransmissionFormat PrimaryTransF WITH (NOLOCK) ON primaryTP.BIN = PrimaryTransF.BIN AND primaryTP.TransmissionFormatVersion = PrimaryTransF.TransmissionFormatVersion
	LEFT JOIN ThirdParty.Address primaryTPAdd WITH (NOLOCK) ON primaryTPAdd.AddressID = primaryTP.PrimaryAddressID
	LEFT JOIN ThirdParty.SubmissionType primarySubType WITH (NOLOCK) ON primarySubType.SubmissionTypeID = primaryTP.SubmissionTypeID
	LEFT JOIN Prescription.Claim primaryLClaim WITH (NOLOCK) ON primaryLClaim.ClaimID =  rxtPrimaryPPM.LatestClaimID 			
	LEFT JOIN Prescription.Transmission primaryLtrans WITH (NOLOCK) ON primaryLClaim.TransmissionID = primaryLtrans.TransmissionID
	LEFT JOIN ThirdParty.PlanType primaryPT WITH (NOLOCK) ON primaryPT.PlanTypeID = primaryTP.PlanTypeID
	LEFT JOIN Person.PatientPayMethodThirdPartyPatientResidenceType primaryPPMTPPRT WITH (NOLOCK) ON primaryPPMTPPRT.PlaceOfResidenceTypeID = primaryPPMTP.PlaceOfResidenceTypeID
	LEFT JOIN Prescription.OtherCoverageType primaryOC WITH (NOLOCK) ON rxtPrimaryPPM.OtherCoverageTypeID = primaryOC.OtherCoverageTypeID
	LEFT JOIN Prescription.RxTransactionPatientPayMethod rxtSecondaryPPM WITH (NOLOCK) ON rxtSecondaryPPM.PatientPayMethodID = rxt.SecondaryPatientPayMethodID
															AND rxtSecondaryPPM.RxTransactionID = rxt.RxTransactionID
	LEFT JOIN Prescription.ThirdPartyPaidStatusType secondaryPaidStat WITH (NOLOCK) ON rxtSecondaryPPM.ThirdPartyPaidStatusTypeID = secondaryPaidStat.ThirdPartyPaidStatusTypeID
	LEFT JOIN Person.PatientPayMethodThirdParty secondaryPPMTP WITH (NOLOCK) ON secondaryPPMTP.PatientPayMethodID = rxt.SecondaryPatientPayMethodID
	LEFT JOIN ThirdParty.ThirdParty secondaryTP WITH (NOLOCK) ON secondaryPPMTP.ThirdPartyID = secondaryTP.ThirdPartyID
	LEFT JOIN Prescription.Claim secondaryLclaim WITH (NOLOCK) ON secondaryLclaim.ClaimID = rxtSecondaryPPM.LatestClaimID
	LEFT JOIN Prescription.Transmission secondaryLtrans WITH (NOLOCK) ON secondaryLclaim.TransmissionID = secondaryLtrans.TransmissionID
	LEFT JOIN ThirdParty.PlanType SecondaryPT WITH (NOLOCK) ON SecondaryPT.PlanTypeID = secondaryTP.PlanTypeID
	LEFT JOIN ThirdParty.TransmissionFormat SecondaryTransF WITH (NOLOCK) ON SecondaryTP.BIN = SecondaryTransF.BIN AND SecondaryTP.TransmissionFormatVersion = SecondaryTransF.TransmissionFormatVersion
	LEFT JOIN Person.PatientPayMethodThirdPartyPatientResidenceType secondaryPPMTPPRT  WITH(NOLOCK) ON secondaryPPMTPPRT.PlaceOfResidenceTypeID =secondaryPPMTP.PlaceOfResidenceTypeID
	LEFT JOIN Prescription.OtherCoverageType secondaryOC WITH (NOLOCK) ON rxtSecondaryPPM.OtherCoverageTypeID = secondaryOC.OtherCoverageTypeID

	WHERE rx.RxID IN (%RXID_PLACEHOLDER%)

	ORDER BY rxt.RxID, rxt.RefillNumber DESC