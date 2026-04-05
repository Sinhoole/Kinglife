/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Zhongshu from './pages/Zhongshu';
import Menxia from './pages/Menxia';
import Shangshu from './pages/Shangshu';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="zhongshu" element={<Zhongshu />} />
          <Route path="menxia" element={<Menxia />} />
          <Route path="shangshu" element={<Shangshu />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
