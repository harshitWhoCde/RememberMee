import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const floralImage =
  'https://incredicare.com/wp-content/uploads/2024/08/bigstock-Pensive-Elderly-Mature-Senior-469321337.jpg.webp';

export default function Register() {
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    terms: false, // ✅ add this
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // ✅ Clear error when user fixes it
    if (name === "terms" && checked) {
      setErrors((prev) => ({
        ...prev,
        terms: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Validation
    if (form.password !== form.confirmPassword) {
      // Consider replacing alert with a UI error message state
      alert("Passwords do not match");
      return;
    }

    // ... terms validation ...

    setIsSubmitting(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.msg || "Registration failed");
      }

      // 2. Success Logic
      // If using a Toast library, trigger it here instead of alert
      console.log("Registration successful!");
      navigate("/login");

    } catch (error) {
      console.error("Submission Error:", error.message);
      alert(error.message);
    } finally {
      // 3. Always release the loading state
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f7f2] font-body text-[#151515]">
      <section className="mx-auto flex min-h-screen w-full max-w-[1440px] items-center justify-center px-5 py-8 sm:px-8">
        {/* Added 'relative' here to allow absolute positioning of the logo */}
        <div className="relative grid w-full max-w-[1200px] overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-2xl shadow-black/10 lg:min-h-[760px] lg:grid-cols-[0.92fr_1.08fr]">

          {/* --- BRANDING LOGO --- */}
          <div className="absolute left-8 top-8 z-10 lg:left-12 lg:top-10">
            <h1 className="font-headline text-[34px] font-extrabold tracking-tight text-[#1c1c1a]">
              RememberMe 👋
            </h1>
          </div>

          <div className="flex items-center justify-center px-6 pt-32 pb-20 sm:px-12 lg:px-16">
            <div className="w-full max-w-[390px]">
              {/* Added 'text-center' to the div below */}
              <div className="mb-10 text-center">
                {/* Sign In Header */}
                <h1 className="font-headline text-[34px] font-extrabold leading-tight text-[#1c1c1a]">
                  Sign Up
                </h1>

                <p className="mt-3 text-sm leading-6 text-[#7a7a72]">
                  Focus on the moment, we’ll handle the memories.<br />
                  Sign up to begin your journey with us.
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="name" className="mb-2 block text-sm font-semibold text-[#33332f]">
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="John Doe"
                    value={form.name}
                    onChange={handleChange}
                    autoComplete="name"
                    className="h-12 w-full rounded-xl border border-[#e6e4db] bg-[#fbfbf8] px-4 text-sm text-[#1f1f1b] outline-none transition placeholder:text-[#b6b3aa] focus:border-[#1f2f36] focus:bg-white focus:ring-4 focus:ring-[#1f2f36]/10"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-semibold text-[#33332f]">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    autoComplete="email"
                    placeholder="Example@email.com"
                    className="h-12 w-full rounded-xl border border-[#e6e4db] bg-[#fbfbf8] px-4 text-sm text-[#1f1f1b] outline-none transition placeholder:text-[#b6b3aa] focus:border-[#1f2f36] focus:bg-white focus:ring-4 focus:ring-[#1f2f36]/10"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label htmlFor="password" className="block text-sm font-semibold text-[#33332f]">
                      Password
                    </label>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    placeholder="Enter your password"
                    className="h-12 w-full rounded-xl border border-[#e6e4db] bg-[#fbfbf8] px-4 text-sm text-[#1f1f1b] outline-none transition placeholder:text-[#b6b3aa] focus:border-[#1f2f36] focus:bg-white focus:ring-4 focus:ring-[#1f2f36]/10"
                  />
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label htmlFor="confirm-password" className="block text-sm font-semibold text-[#33332f]">
                      Confirm Password
                    </label>
                  </div>
                  <input
                    id="confirm-password"
                    name="confirmPassword"
                    type="password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    className="h-12 w-full rounded-xl border border-[#e6e4db] bg-[#fbfbf8] px-4 text-sm text-[#1f1f1b] outline-none transition placeholder:text-[#b6b3aa] focus:border-[#1f2f36] focus:bg-white focus:ring-4 focus:ring-[#1f2f36]/10"
                  />
                </div>

                <button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-[#1f2f36] text-base font-bold text-white shadow-lg shadow-[#1f2f36]/20 transition hover:bg-[#0B2D72] active:scale-[0.99]" disabled={isSubmitting}
                >{isSubmitting ? "Signing up.." : "Sign up"}

                </button>
              </form>

              <div className="my-8 flex items-center gap-4">
                <div className="h-px flex-1 bg-[#ece9df]"></div>
                <span className="text-sm font-semibold text-[#9a978d]">Or</span>
                <div className="h-px flex-1 bg-[#ece9df]"></div>
              </div>

              <p className="mt-8 text-center text-sm text-[#77746c]">
                Already have an account?{' '}
                <Link className="font-extrabold text-[#1f2f36] hover:text-[#1E4AE9] hover:underline transition" to="/login">Sign In</Link>
              </p>
            </div>
          </div>

          <div className="relative hidden bg-[#111512] p-4 lg:block">
            <div
              className="h-full w-full rounded-[22px] bg-cover bg-center shadow-inner"
              style={{ backgroundImage: `url(${floralImage})` }}
            >
              <div className="flex h-full flex-col justify-between rounded-[22px] bg-gradient-to-b from-black/20 via-transparent to-black/55 p-8 text-white">
                <div className="flex justify-end">
                  <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] backdrop-blur-md">
                    Secure Access
                  </div>
                </div>
                <div className="max-w-sm">
                  <h2 className="font-headline text-4xl font-extrabold leading-tight">
                    Memory support for familiar moments.
                  </h2>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
