import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/layout";
import { Dashboard } from "./pages/dashboard";
import { PackagesList } from "./pages/packages-list";
import { PackageDetail } from "./pages/package-detail";
import { EnvironmentsList } from "./pages/environments-list";
import { EnvironmentDetail } from "./pages/environment-detail";
import { BuildDetail } from "./pages/build-detail";

export function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/packages" element={<PackagesList />} />
        <Route path="/packages/:name" element={<PackageDetail />} />
        <Route path="/environments" element={<EnvironmentsList />} />
        <Route path="/environments/:id" element={<EnvironmentDetail />} />
        <Route path="/builds/:id" element={<BuildDetail />} />
      </Routes>
    </Layout>
  );
}
