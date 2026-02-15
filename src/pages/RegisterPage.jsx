import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Register</CardTitle>
          <p className="text-sm text-muted-foreground">Registration is handled by the backend.</p>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Contact your administrator to create an account, or use the seed user (admin / password123) for development.
          </p>
        </CardContent>
        <CardFooter>
          <Link to="/login" className="w-full">
            <Button variant="outline" className="w-full">Back to Sign in</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
