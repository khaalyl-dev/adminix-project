
// GoogleOAuthFailure component displays an error message when Google OAuth authentication fails
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";

const GoogleOAuthFailure = () => {
  // React Router hook for navigation
  const navigate = useNavigate();

  return (
    // Main container for the OAuth failure page, centered with padding and background
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        {/* Logo and app name link to home */}
        <Link
          to="/"
          className="flex items-center gap-2 self-center font-medium"
        >
          <Logo />
          Team Sync.
        </Link>
        {/* Spacer for layout consistency */}
        <div className="flex flex-col gap-6"></div>
      </div>
      {/* Card containing the error message and action button */}
      <Card>
        <CardContent>
          <div style={{ textAlign: "center", marginTop: "50px" }}>
            <h1>Authentication Failed</h1>
            <p>We couldn't sign you in with Google. Please try again.</p>

            {/* Button to navigate back to login page */}
            <Button onClick={() => navigate("/")} style={{ marginTop: "20px" }}>
              Back to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleOAuthFailure;
