from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or specify your Vercel domain once deployed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)