import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { getUserId, updateUser, changePassword, removeUser } from '../services/User';
import { getParkingsByOwner } from '../services/Parking';

export function useProfile() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const setUser = useAuthStore((state) => state.setUser);

  const userId =
    currentUser?.id ||
    currentUser?._id ||
    localStorage.getItem('parkflow_user_id') ||
    JSON.parse(localStorage.getItem('user') || '{}')?.id;

  const [loading, setLoading] = useState(true);
  const [personalLoading, setPersonalLoading] = useState(false);
  const [fiscalLoading, setFiscalLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [prefsLoading, setPrefsLoading] = useState(false);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal de confirmación para eliminar cuenta con doble chequeo
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Rol del usuario y navegación
  const userType = (currentUser?.type || '').toUpperCase();
  const isOwner = userType.includes('DUE') || userType.includes('OWNER');
  const isAdmin = userType.includes('ADMIN');

  const backNavigation = isOwner
    ? { label: 'Volver al Panel de Dueño', path: '/owner' }
    : isAdmin
    ? { label: 'Volver al Panel Administrador', path: '/admin' }
    : { label: 'Volver al Mapa', path: '/' };

  // Cantidad de sucursales si es Dueño
  const [parkingsCount, setParkingsCount] = useState<number | null>(null);

  // 1. Datos Personales
  const [personalData, setPersonalData] = useState({
    name: '',
    last_name: '',
    email: '',
    phone: '',
  });

  // 2. Datos Fiscales / Facturación
  const [fiscalData, setFiscalData] = useState({
    businessName: '',
    cuit: '',
    vatCondition: 'Responsable Inscripto',
    fiscalAddress: '',
  });

  // 3. Seguridad y Contraseña
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // 4. Preferencias y Notificaciones
  const [preferences, setPreferences] = useState({
    alertFullCapacity: true,
    alertNewBooking: true,
    alertTariffExpiring: false,
  });

  useEffect(() => {
    if (!userId) {
      setErrorMsg('No se encontró la sesión del usuario.');
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const [userData, parkingsData] = await Promise.all([
          getUserId(userId).catch(() => null),
          isOwner ? getParkingsByOwner(userId).catch(() => []) : Promise.resolve([]),
        ]);

        if (userData) {
          const u = userData.data || userData;
          setPersonalData({
            name: u.name || '',
            last_name: u.last_name || '',
            email: u.email || '',
            phone: u.phone || '',
          });
        }

        if (Array.isArray(parkingsData)) {
          setParkingsCount(parkingsData.length);
        } else if ((parkingsData as any)?.data && Array.isArray((parkingsData as any).data)) {
          setParkingsCount((parkingsData as any).data.length);
        } else {
          setParkingsCount(0);
        }

        const savedFiscal = localStorage.getItem(`parkflow_fiscal_${userId}`);
        if (savedFiscal) {
          try {
            setFiscalData(JSON.parse(savedFiscal));
          } catch {
            // fallback
          }
        }

        const savedPrefs = localStorage.getItem(`parkflow_prefs_${userId}`);
        if (savedPrefs) {
          try {
            setPreferences(JSON.parse(savedPrefs));
          } catch {
            // fallback
          }
        }
      } catch (err: any) {
        setErrorMsg(err.response?.data?.message || 'Error al cargar perfil');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userId, isOwner]);

  const showFeedback = useCallback((msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setSuccessMsg(null);
    } else {
      setSuccessMsg(msg);
      setErrorMsg(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  }, []);

  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personalData.name.trim() || !personalData.last_name.trim()) {
      showFeedback('Por favor completá los campos obligatorios.', true);
      return;
    }

    setPersonalLoading(true);
    try {
      await updateUser(userId, personalData);
      setUser({ ...currentUser, ...personalData });
      showFeedback('Datos personales actualizados correctamente.');
    } catch (err: any) {
      showFeedback(err.response?.data?.message || 'Error al actualizar datos personales', true);
    } finally {
      setPersonalLoading(false);
    }
  };

  const handleSaveFiscal = (e: React.FormEvent) => {
    e.preventDefault();
    setFiscalLoading(true);
    try {
      localStorage.setItem(`parkflow_fiscal_${userId}`, JSON.stringify(fiscalData));
      showFeedback('Datos fiscales guardados con éxito.');
    } catch {
      showFeedback('Error al guardar datos fiscales.', true);
    } finally {
      setFiscalLoading(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('Completá todos los campos de contraseña.');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Las nuevas contraseñas no coinciden.');
      return;
    }

    setPasswordLoading(true);
    try {
      await changePassword(userId, passwordForm.currentPassword, passwordForm.newPassword);
      showFeedback('Contraseña actualizada correctamente.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Error al cambiar contraseña');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleTogglePref = (key: keyof typeof preferences) => {
    const updated = { ...preferences, [key]: !preferences[key] };
    setPreferences(updated);
    setPrefsLoading(true);
    try {
      localStorage.setItem(`parkflow_prefs_${userId}`, JSON.stringify(updated));
      showFeedback('Preferencias de notificación guardadas.');
    } catch {
      // ignore
    } finally {
      setPrefsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleOpenDeleteModal = () => {
    setDeleteInput('');
    setConfirmingDelete(true);
  };

  const confirmDelete = async () => {
    if (!userId || deleteInput.trim() !== 'ELIMINAR') return;

    setDeleteLoading(true);
    try {
      await removeUser(userId);
      logout();
      navigate('/login');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al eliminar la cuenta');
      setConfirmingDelete(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  const roleBadge = isOwner
    ? 'Propietario / Dueño'
    : isAdmin
    ? 'Administrador'
    : 'Conductor / Cliente';

  const userInitials = personalData.name
    ? `${personalData.name.charAt(0)}${personalData.last_name ? personalData.last_name.charAt(0) : ''}`.toUpperCase()
    : 'U';

  return {
    navigate,
    userId,
    loading,
    isOwner,
    isAdmin,
    backNavigation,
    roleBadge,
    userInitials,
    parkingsCount,
    personalData,
    setPersonalData,
    personalLoading,
    handleSavePersonal,
    fiscalData,
    setFiscalData,
    fiscalLoading,
    handleSaveFiscal,
    passwordForm,
    setPasswordForm,
    showCurrentPassword,
    setShowCurrentPassword,
    showNewPassword,
    setShowNewPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    passwordError,
    passwordLoading,
    handleSavePassword,
    preferences,
    prefsLoading,
    handleTogglePref,
    errorMsg,
    successMsg,
    confirmingDelete,
    setConfirmingDelete,
    deleteInput,
    setDeleteInput,
    deleteLoading,
    handleOpenDeleteModal,
    confirmDelete,
    handleLogout,
  };
}

export type ProfileProps = ReturnType<typeof useProfile>;
