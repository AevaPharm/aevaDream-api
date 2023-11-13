SELECT rx.RxID, rxtStatus.RxTransactionStatusTypeText, rxt.ChangedOn
FROM Prescription.Rx rx
JOIN Prescription.RxTransaction rxt ON rx.RxID = rxt.RxID
LEFT JOIN Prescription.RxStatusType rxstat WITH (NOLOCK)ON rx.RxStatusTypeID = rxstat.RxStatusTypeID
LEFT JOIN Prescription.RxTransactionStatusType rxtStatus WITH (NOLOCK) ON rxt.RxTransactionStatusTypeID = rxtStatus.RxTransactionStatusTypeID
WHERE 
rx.ActiveQueueCount != '0'
AND  rxstat.RxStatusTypeText NOT IN ('Discontinued', 'Expired or No Refills', 'Transferred', 'Canceled', 'Deleted')
AND rx.ExpirationDate > GETDATE()
ORDER BY rx.AvailableForFillDate DESC