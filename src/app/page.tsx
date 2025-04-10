import { fetchRandomExoplanet } from "@/data-access/nasa";

export default async function Home() {
  const exoplanet = await fetchRandomExoplanet();
  console.log(exoplanet);
  return <div className="flex justify-center">Hello</div>;
}
