import { Route, Routes } from 'react-router'
import Layout from './components/Layout/Layout.jsx'
import Home from './pages/Home/Home.jsx'
import Radici from './pages/Radici/Radici.jsx'
import AddettiAiLavori from './pages/AddettiAiLavori/AddettiAiLavori.jsx'
import NotFound from './pages/NotFound/NotFound.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="radici" element={<Radici />} />
        <Route path="addetti-ai-lavori" element={<AddettiAiLavori />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
