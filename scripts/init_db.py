import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.models.base import Base
from app.models.user import Teacher
from app.models.book import Book
from app.core.security import hash_password
from app.core.config import settings


BOOKS_DATA = [
    {"name": "第一册 - 基础笔画（一）", "order_num": 1, "description": "横、竖、撇、捺基础笔画练习"},
    {"name": "第二册 - 基础笔画（二）", "order_num": 2, "description": "点、折、钩、挑进阶笔画"},
    {"name": "第三册 - 简单汉字（一）", "order_num": 3, "description": "人口手足简单汉字"},
    {"name": "第四册 - 简单汉字（二）", "order_num": 4, "description": "山川日月自然汉字"},
    {"name": "第五册 - 偏旁部首（一）", "order_num": 5, "description": "氵、木、月偏旁练习"},
    {"name": "第六册 - 偏旁部首（二）", "order_num": 6, "description": "艹、忄、扌偏旁练习"},
    {"name": "第七册 - 常用字（一）", "order_num": 7, "description": "一二三四五六七八九十"},
    {"name": "第八册 - 常用字（二）", "order_num": 8, "description": "大小多少上下左右"},
    {"name": "第九册 - 常用字（三）", "order_num": 9, "description": "天地日月风雨雪霜"},
    {"name": "第十册 - 常用字（四）", "order_num": 10, "description": "金木水火土五行"},
    {"name": "第十一册 - 词语练习（一）", "order_num": 11, "description": "美丽、可爱、开心词语"},
    {"name": "第十二册 - 词语练习（二）", "order_num": 12, "description": "学习、进步、成长词语"},
    {"name": "第十三册 - 短句练习（一）", "order_num": 13, "description": "我爱学习天天向上"},
    {"name": "第十四册 - 短句练习（二）", "order_num": 14, "description": "勤奋学习持之以恒"},
    {"name": "第十五册 - 诗词启蒙（一）", "order_num": 15, "description": "静夜思、登鹳雀楼"},
    {"name": "第十六册 - 诗词启蒙（二）", "order_num": 16, "description": "春晓、绝句简词"},
    {"name": "第十七册 - 成语练习（一）", "order_num": 17, "description": "一心一意、三心二意"},
    {"name": "第十八册 - 成语练习（二）", "order_num": 18, "description": "五颜六色、七上八下"},
    {"name": "第十九册 - 对联练习（一）", "order_num": 19, "description": "春联入门简单对联"},
    {"name": "第二十册 - 对联练习（二）", "order_num": 20, "description": "春联进阶经典对联"},
    {"name": "第二十一册 - 作品创作（一）", "order_num": 21, "description": "扇面作品创作"},
    {"name": "第二十二册 - 作品创作（二）", "order_num": 22, "description": "条幅作品创作"},
    {"name": "第二十三册 - 作品创作（三）", "order_num": 23, "description": "斗方作品创作"},
    {"name": "第二十四册 - 作品创作（四）", "order_num": 24, "description": "横批作品创作"},
    {"name": "第二十五册 - 综合创作", "order_num": 25, "description": "综合书法创作练习"},
]


async def init_db():
    engine = create_async_engine(settings.DATABASE_URL, echo=True)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    
    AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with AsyncSessionLocal() as session:
        admin = Teacher(
            name="管理员",
            phone="13900000000",
            password_hash=hash_password("admin123"),
            role="admin"
        )
        session.add(admin)
        
        teacher = Teacher(
            name="张老师",
            phone="13800000000",
            password_hash=hash_password("teacher123"),
            role="teacher"
        )
        session.add(teacher)
        
        for book_data in BOOKS_DATA:
            book = Book(**book_data)
            session.add(book)
        
        await session.commit()
    
    print("数据库初始化完成！")
    print(f"默认管理员账号: 手机号 13900000000, 密码 admin123")
    print(f"默认教师账号: 手机号 13800000000, 密码 teacher123")
    print(f"已创建 {len(BOOKS_DATA)} 册练习册")
    
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(init_db())
