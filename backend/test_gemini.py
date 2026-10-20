import asyncio
from app.ai.gemini_service import generate_text


async def main():
    print("Testing Gemini connection...")

    response = await generate_text(
        "Reply with exactly: InterviewIQ Gemini connection successful."
    )

    print("\nGemini response:")
    print(response)


if __name__ == "__main__":
    asyncio.run(main())