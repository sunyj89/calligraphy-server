from fastapi import HTTPException


class AppException(HTTPException):
    def __init__(self, status_code: int, detail: str):
        super().__init__(status_code=status_code, detail=detail)


class UnauthorizedException(AppException):
    def __init__(self, detail: str = "unauthorized"):
        super().__init__(status_code=401, detail=detail)


class NotFoundException(AppException):
    def __init__(self, detail: str = "resource not found"):
        super().__init__(status_code=404, detail=detail)


class BadRequestException(AppException):
    def __init__(self, detail: str = "bad request"):
        super().__init__(status_code=400, detail=detail)


class ForbiddenException(AppException):
    def __init__(self, detail: str = "forbidden"):
        super().__init__(status_code=403, detail=detail)
