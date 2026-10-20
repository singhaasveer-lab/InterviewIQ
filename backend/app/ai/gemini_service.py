import asyncio

from backend.app.ai.gemini_client import get_gemini_client


MODEL_NAME = "gemini-3.8-flash"


async def generate_text(prompt: str) -> str:
    client = get_gemini_client()

    last_error = None

    for attempt in range(3):
        try:
            print(
                f"Gemini attempt {attempt + 1}/3 "
                f"using {MODEL_NAME}"
            )

            # The SDK call is blocking; run it in a worker thread so it
            # doesn't freeze the event loop for every other request.
            response = await asyncio.to_thread(
                client.models.generate_content,
                model=MODEL_NAME,
                contents=prompt,
            )

            if response.text:
                print("Gemini request completed successfully.")
                return response.text

            raise RuntimeError(
                "Gemini returned an empty response."
            )

        except Exception as error:
            last_error = error

            print(
                f"Gemini attempt {attempt + 1} failed: "
                f"{type(error).__name__}: {error}"
            )

            if attempt < 2:
                await asyncio.sleep(3)

    raise RuntimeError(
        f"Gemini request failed after 3 attempts: {last_error}"
    )