import { fetchRandomExoplanet } from "@/data-access/nasa";
import { generatePlanetFeatures } from "@/utils/planet-generator";
import PlanetViewer from "@/components/PlanetViewer";

export default async function Home() {
  const exoplanet = await fetchRandomExoplanet();
  console.log(exoplanet);
  const features = generatePlanetFeatures(exoplanet);
  console.log(features);

  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-4xl font-bold mb-8 text-center">
        Exoplanet of the Day: {exoplanet.pl_name}
      </h1>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <PlanetViewer features={features} />
        </div>
      </div>
    </main>
  );
}
