
// SignUp component handles user registration, form validation, and UI rendering
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { registerMutationFn } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import GoogleOauthButton from "@/components/auth/google-oauth-button";
import "./login-signup.css";

const SignUp = () => {
  // React Router hook for navigation
  const navigate = useNavigate();
  // Setup mutation for registration API call
  const { mutate, isPending } = useMutation({
    mutationFn: registerMutationFn,
  });
  // Define form validation schema using zod
  const formSchema = z.object({
    name: z.string().trim().min(1, {
      message: "Name is required",
    }),
    email: z.string().trim().email("Invalid email address").min(1, {
      message: "Email is required",
    }),
    password: z.string().trim().min(1, {
      message: "Password is required",
    }),
  });
  // Initialize react-hook-form with schema and default values
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });
  // Handle form submission
  const onSubmit = (values: { name: string; email: string; password: string }) => {
    if (isPending) return; // Prevent multiple submissions
    mutate(values, {
      onSuccess: () => {
        // On successful registration, redirect to project setup page
        navigate("/ProjectSetup");
      },
      onError: (error) => {
        // Show error toast on registration failure
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };
  return (
    // Main container for the signup page
    <div className="login-root">
      <div className="box-root flex-flex flex-direction--column" style={{ minHeight: "100vh", flexGrow: 1 }}>
        {/* Decorative background elements for styling */}
        <div className="loginbackground box-background--white padding-top--64">
          <div className="loginbackground-gridContainer">
            {/* Various background boxes for visual design */}
            <div className="box-root flex-flex" style={{ gridArea: "top / start / 8 / end" }}>
              <div className="box-root" style={{ backgroundImage: "linear-gradient(white 0%, rgb(247, 250, 252) 33%)", flexGrow: 1 }}></div>
            </div>
            <div className="box-root flex-flex" style={{ gridArea: "4 / 2 / auto / 5" }}>
              <div className="box-root box-divider--light-all-2 animationLeftRight tans3s" style={{ flexGrow: 1 }}></div>
            </div>
            <div className="box-root flex-flex" style={{ gridArea: "6 / start / auto / 2" }}>
              <div className="box-root box-background--blue800" style={{ flexGrow: 1 }}></div>
            </div>
            <div className="box-root flex-flex" style={{ gridArea: "7 / start / auto / 4" }}>
              <div className="box-root box-background--blue animationLeftRight" style={{ flexGrow: 1 }}></div>
            </div>
            <div className="box-root flex-flex" style={{ gridArea: "8 / 4 / auto / 6" }}>
              <div className="box-root box-background--gray100 animationLeftRight tans3s" style={{ flexGrow: 1 }}></div>
            </div>
            <div className="box-root flex-flex" style={{ gridArea: "2 / 15 / auto / end" }}>
              <div className="box-root box-background--cyan200 animationRightLeft tans4s" style={{ flexGrow: 1 }}></div>
            </div>
            <div className="box-root flex-flex" style={{ gridArea: "3 / 14 / auto / end" }}>
              <div className="box-root box-background--blue animationRightLeft" style={{ flexGrow: 1 }}></div>
            </div>
            <div className="box-root flex-flex" style={{ gridArea: "4 / 17 / auto / 20" }}>
              <div className="box-root box-background--gray100 animationRightLeft tans4s" style={{ flexGrow: 1 }}></div>
            </div>
            <div className="box-root flex-flex" style={{ gridArea: "5 / 14 / auto / 17" }}>
              <div className="box-root box-divider--light-all-2 animationRightLeft tans3s" style={{ flexGrow: 1 }}></div>
            </div>
          </div>
        </div>
        {/* Main content area for the signup form */}
        <div className="box-root padding-top--24 flex-flex flex-direction--column" style={{ flexGrow: 1, zIndex: 9 }}>
          {/* Logo/Header */}
          <div className="box-root padding-top--48 padding-bottom--24 flex-flex flex-justifyContent--center">
            <h1><a href="/">AdminiX</a></h1>
          </div>
          <div className="formbg-outer">
            <div className="formbg">
              <div className="formbg-inner padding-horizontal--48">
                <span className="padding-bottom--15">Sign up for an account</span>
                {/* Signup form */}
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  {/* Name field */}
                  <div className="field padding-bottom--24">
                    <label htmlFor="name">Name</label>
                    <input
                      type="text"
                      id="name"
                      {...form.register("name")}
                      disabled={isPending}
                    />
                    {/* Show validation error for name */}
                    {form.formState.errors.name && (
                      <div className="form-error">{form.formState.errors.name.message}</div>
                    )}
                  </div>
                  {/* Email field */}
                  <div className="field padding-bottom--24">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      {...form.register("email")}
                      disabled={isPending}
                    />
                    {/* Show validation error for email */}
                    {form.formState.errors.email && (
                      <div className="form-error">{form.formState.errors.email.message}</div>
                    )}
                  </div>
                  {/* Password field */}
                  <div className="field padding-bottom--24">
                    <label htmlFor="password">Password</label>
                    <input
                      type="password"
                      id="password"
                      {...form.register("password")}
                      disabled={isPending}
                    />
                    {/* Show validation error for password */}
                    {form.formState.errors.password && (
                      <div className="form-error">{form.formState.errors.password.message}</div>
                    )}
                  </div>
                  {/* Submit button */}
                  <div className="field padding-bottom--24">
                    <input
                      type="submit"
                      name="submit"
                      value={isPending ? "Signing up..." : "Sign up"}
                      disabled={isPending}
                    />
                  </div>
                  {/* Google OAuth signup button */}
                  <div className="field">
                    <GoogleOauthButton label="Signup with Google" />
                  </div>
                </form>
              </div>
            </div>
            {/* Footer links for sign in, contact, privacy, etc. */}
            <div className="footer-link padding-top--24">
              <span>Already have an account? <Link to="/">Sign in</Link></span>
              <div className="listing padding-top--24 padding-bottom--24 flex-flex center-center">
                <span><a href="#">© AdminiX</a></span>
                <span><a href="#">Contact</a></span>
                <span><a href="#">Privacy & terms</a></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
