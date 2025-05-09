import SignupForm from "@/app/ui/signup-form";
import JaminLogo from "@/app/ui/jamin-logo";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 to-slate-900 p-4">
      <div className="w-full max-w-md transform transition-all">
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-2xl">
          {/* Header with gradient */}
          <div className="relative bg-gradient-to-r from-primary/90 to-primary/70 px-6 py-8">
            <div className="absolute inset-0 bg-[url('/placeholder.svg?height=100&width=100')] bg-[length:20px_20px] bg-repeat opacity-5"></div>
            <div className="relative mb-2 w-32 text-white md:w-36">
              <JaminLogo />
            </div>
            <h1 className="text-2xl font-bold text-white">Create Account</h1>
            <p className="mt-1 text-white/80">Sign up to get started</p>
          </div>
          {/* Form container */}
          <div className="p-6">
            <SignupForm />
          </div>
        </div>
        {/* Footer */}
        <div className="mt-6 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Jamin. All rights reserved.</p>
        </div>
      </div>
    </main>
  );
}