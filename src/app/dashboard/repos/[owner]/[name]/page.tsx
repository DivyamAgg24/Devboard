export default async function RepoMetricsPage({params}: any) {
    const {name, owner} = await params
    return <div>This is the repo metrics page {name} {owner}</div>
}