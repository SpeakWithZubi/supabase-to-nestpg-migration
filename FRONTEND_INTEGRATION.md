FRONTEND INTEGRATION GUIDE (PART A)

ENVIRONMENT VARIABLES
The frontend needs to point to the new NestJS API URL.
Add this to the frontend environment file:
NEXT_PUBLIC_API_BASE_URL="http://localhost:3000"

AUTHENTICATION FLOW

Stop using Supabase Auth (supabase.auth.signInWithOtp).

To Request OTP: POST to /auth/otp/request with JSON body: {"phone": "+91..."}

To Verify OTP: POST to /auth/otp/verify with JSON body: {"phone": "+91...", "token": "123456"}

Save the "access_token" returned from the verify endpoint into localStorage or secure cookies.

MAKING SECURE REQUESTS
For all protected routes (/users/me, /child-profiles/me, /sessions), you must send the token in the headers like this:
Authorization: Bearer YOUR_ACCESS_TOKEN