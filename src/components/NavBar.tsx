import Link from "next/link";

export const NavBar = ({ session }: {
    session: {
        user: null;
    } | {
        user: {
            id: string;
        };
    }
}) => {
    return <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-gray-100 bg-white/90 px-8 py-4 backdrop-blur">
        <span className="text-lg font-semibold tracking-tight">Devboard</span>
        <div className="flex items-center gap-4">
            <Link href="#features" className="hidden text-sm text-gray-500 hover:text-gray-900 transition-colors sm:block">
                Features
            </Link>
            <Link href="#how-it-works" className="hidden text-sm text-gray-500 hover:text-gray-900 transition-colors sm:block">
                How it works
            </Link>
            {session.user ? (
                <Link
                    href="/dashboard"
                    className="rounded-full bg-[#332fb5] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#2a26a0] transition-colors"
                >
                    Dashboard
                </Link>
            ) : (
                <div className="flex items-center gap-3">
                    <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                        Sign in
                    </Link>
                    <Link
                        href="/signup"
                        className="rounded-full bg-[#332fb5] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#2a26a0] transition-colors"
                    >
                        Get started
                    </Link>
                </div>
            )}
        </div>
    </nav>
}