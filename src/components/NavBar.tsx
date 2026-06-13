import Link from "next/link";

export const NavBar = () => {
    return <div className="flex gap-x-5 text-[15px] mx-14 my-8 items-center justify-between">
        <div className="flex">
            <Link href="/" className="text-lg w-48">Devboard</Link>
            <div className="flex items-center gap-x-5">
                <Link href="/dashboard">Dashboard</Link>
                <Link href="/dashboard">Profile</Link>
            </div>
        </div>
        <div className="flex gap-x-5 items-center">
            <Link href="/login" className="text-[#332fb5]" >Login</Link>
            <Link href="/signup" className="px-5 py-1 rounded-3xl text-white bg-[#332fb5]">Signup</Link>
        </div>
    </div>
}