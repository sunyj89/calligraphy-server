from fastapi import HTTPException, status


class AppException(HTTPException):
    def __init__(self, status_code: int, detail: str):
        super().__init__(status_code=status_code, detail=detail)


class UnauthorizedException(AppException):
    def __init__(self, detail: str = "未授权"):
        super().__init__(status_code=401, detail=detail)


class NotFoundException(AppException):
    def __init__(self, detail: str = "资源不存在"):
        super().__init__(status_code=404, detail=detail)


class BadRequestException(AppException):
    def __init__(self, detail: str = "请求错误"):
        super().__init__(status_code=400, detail=detail)


class ForbiddenException(AppException):
    def __init__(self, detail: str = "禁止访问"):
        super().__init__(status_code=403, detail=detail)
