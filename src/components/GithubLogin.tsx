"use client"
export const GithubLogin = () => {
    const handleClick = async () => {
        window.location.href = "http://localhost:3000/api/github/login"
    }
    return <div>
        <div>Connect your GitHub to see the repos</div>
        <button onClick={handleClick} className="cursor-pointer">Connect</button>
    </div>
}