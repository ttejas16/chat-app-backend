class ApiError extends Error {
    constructor(
        public statusCode: number,
        public message: string,
        public code?: number | string
    ){
        super(message);
        this.name = "ApiError"
    }
}

export default ApiError;