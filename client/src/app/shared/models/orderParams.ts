export class OrderParams {
    pageNumber = 1;
    pageSize = 10;
    status = '';
    paymentStatus = '';
    paymentType = '';
    deliveryStatus = '';
    search = '';
    startDate?: Date;
    endDate?: Date;
}