import React from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { loginMutationFn } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import GoogleOauthButton from "@/components/auth/google-oauth-button";
import "./login-signup.css";

const SignIn = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");
  const { mutate, isPending } = useMutation({
    mutationFn: loginMutationFn,
  });
  const formSchema = z.object({
    email: z.string().trim().email("Invalid email address").min(1, {
      message: "Email is required",
    }),
    password: z.string().trim().min(1, {
      message: "Password is required",
    }),
  });
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const onSubmit = (values: { email: string; password: string }) => {
    if (isPending) return;
    mutate(values, {
      onSuccess: (data) => {
        const user = data.user;
        const decodedUrl = returnUrl ? decodeURIComponent(returnUrl) : null;
        navigate(decodedUrl || `/workspace/${user.currentWorkspace}`);
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };
  return (
    <div className="login-root">
      <div className="box-root flex-flex flex-direction--column" style={{ minHeight: "100vh", flexGrow: 1 }}>
        <div className="loginbackground box-background--white padding-top--64">
          <div className="loginbackground-gridContainer" style={{ paddingTop: "200px" }}>
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
        <div className="box-root padding-top--24 flex-flex flex-direction--column" style={{ flexGrow: 1, zIndex: 9 }}>
          <div className="box-root padding-top--48 padding-bottom--24 flex-flex flex-justifyContent--center">
            <h1><a href="/">AdminiX</a></h1>
          </div>
          <div className="formbg-outer">
            <div className="formbg">
              <div className="formbg-inner padding-horizontal--48">
                <span className="padding-bottom--15">Sign in to your account</span>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <div className="field padding-bottom--24">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      {...form.register("email")}
                      disabled={isPending}
                    />
                    {form.formState.errors.email && (
                      <div className="form-error">{form.formState.errors.email.message}</div>
                    )}
                  </div>
                  <div className="field padding-bottom--24">
                    <div className="grid--50-50">
                      <label htmlFor="password">Password</label>
                      <div className="reset-pass">
                        <a href="#">Forgot your password?</a>
                      </div>
                    </div>
                    <input
                      type="password"
                      id="password"
                      {...form.register("password")}
                      disabled={isPending}
                    />
                    {form.formState.errors.password && (
                      <div className="form-error">{form.formState.errors.password.message}</div>
                    )}
                  </div>
                  <div className="field field-checkbox padding-bottom--24 flex-flex align-center">
                    <label htmlFor="staySignedIn">
                      <input type="checkbox" id="staySignedIn" name="staySignedIn" /> Stay signed in for a week
                    </label>
                  </div>
                  <div className="field padding-bottom--24">
                    <input
                      type="submit"
                      name="submit"
                      value={isPending ? "Logging in..." : "Continue"}
                      disabled={isPending}
                    />
                  </div>
                  <div className="field">
                    <GoogleOauthButton label="Login with Google" />
                  </div>
                </form>
              </div>
            </div>
            <div className="footer-link padding-top--24">
              <span>Don't have an account? <Link to="/sign-up">Sign up</Link></span>
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

export default SignIn;
