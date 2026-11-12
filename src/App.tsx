import { lazy, Suspense } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';

const Editor = lazy(() => import('./pages/Editor'));

export default function App() {
  return <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <Suspense fallback={<div className="route-loading">正在打开编辑器…</div>}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/editor/:projectId" element={<Editor />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  </HashRouter>;
}
