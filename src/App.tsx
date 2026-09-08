import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home/Home';
import { Login } from './pages/Auth/Login';
import { Register } from './pages/Auth/Register';
import ParkingSearchPage from '../src/pages/Parking/ParkingSearch.js';
import MyParkings from '../src/pages/Parking/MyParkings.js'
import ParkingCreate  from './pages/Parking/ParkingCreate.js'
import ProfilePage from './pages/Profile/ProfilePage';
import VehicleManagement from './pages/Vehicle/VehicleManagement';
import VehicleRegister from './pages/Vehicle/VehicleRegister';
import { AppLayout } from './components/layout/appLayout.js';
import VehicleSelect from './pages/Vehicle/VehicleSelect.js';
import {ParkingSpaceMap} from './pages/ParkingSpace/ParkingSpaceMap.js';
import EditParkingForm from './pages/Parking/EditParkingForm.js';
import AdminPanel from './pages/Admin/AdminPanel.js';
import AdminVehicleTypes from './pages/Admin/AdminVehicleTypes.js';
import AdminService from './pages/Admin/AdminService.js';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<AppLayout />}>
          <Route path="/select-vehicle" element={<VehicleSelect />} />
          <Route path="/parking" element={<ParkingSearchPage />} />
          <Route path="/parkings/:id/reservar" element={<ParkingSpaceMap />} />
        </Route>

        <Route path="/profile" element={<ProfilePage />} />

        <Route path="/vehicles" element={<VehicleManagement />} />
        <Route path="/vehicles/new" element={<VehicleRegister />} />

        <Route path="/my-parkings" element={<MyParkings />} />
        <Route path="/my-parkings/create" element={<ParkingCreate />} />
        <Route path="/my-parkings/update/:id" element={<EditParkingForm />} />

        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/admin/vehicles" element={<AdminVehicleTypes />} />
        <Route path="/admin/services" element={<AdminService />} />




      </Routes>
    </BrowserRouter>
  );
}

export default App;