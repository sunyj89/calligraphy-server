from enum import Enum


class Term(str, Enum):
    SPRING = "spring"
    SUMMER = "summer"
    AUTUMN = "autumn"


class ScoreCategory(str, Enum):
    PRACTICE = "practice"
    HOMEWORK = "homework"
    WORK = "work"
    COMPETITION = "competition"


class PracticeTarget(str, Enum):
    ROOT = "root"
    TRUNK = "trunk"


class GalleryScope(str, Enum):
    CLASSROOM = "classroom"
    SCHOOL = "school"
    BOTH = "both"
