import Image from "next/image";
import Link from "next/link";
import { getSession } from "../utils/session";

export default async function Home() {
    const session = await getSession()
    
    return (
        <div className="flex flex-col m-15 mb-5">
            <section>
                <div className="grid grid-cols-5">
                    <div className="col-span-3 flex flex-col gap-y-7 ">
                        <h1 className=" font-sans uppercase text-6xl w-7/8 line-clamp-3 leading-19">Your Team's Engineering Health, Visualised</h1>
                        <div className="text-lg w-5/8 ml-1">From your PRs to your deployments, view all your GitHub metrics in one place. Devboard helps you find points of delay and optimize your workflows.</div>
                        <Link href={session ? "/dashboard" : "/signup"} className="px-5 py-1 rounded-3xl w-fit text-white bg-[#332fb5]">Get Started</Link>
                    </div>
                    <div>Image here</div>
                </div>
            </section>
            <section className="flex mt-10 justify-center">
                <div className="flex flex-col items-center justify-center">
                    <div className="text-[#332fb5] uppercase">What We Do</div>
                    <div className="flex mt-7 place-content-center text-4xl">One place for all your metrics</div>
                    <div className="w-5/8 flex text-center mt-5">Connect your GitHub via OAuth. View all your metrics - PR cycle time, deployment, frequency, code churn, contributor activity, in one place.</div>
                </div>
            </section>
            <section className="mt-20">
                <div className="grid grid-cols-6">
                    <div className="flex flex-col">
                        <div>Contact</div>
                        <div></div>
                    </div>
                </div>
                <div className="border my-10 border-gray-300"></div>
                <div className="">© Devboard</div>
            </section>
        </div>
    );
}
