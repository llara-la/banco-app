import React, { useState, useEffect } from 'react';
import { CreditCard, Send, ArrowLeft, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

const BankingApp = () => {
  const [currentView, setCurrentView] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [transferData, setTransferData] = useState({
    destinationAccount: '',
    swiftCode: '',
    amount: '',
    concept: '',
    pin: ''
  });
  const [notification, setNotification] = useState(null);
  const [showInternationalFields, setShowInternationalFields] = useState(false);
  const [isProcessingTransfer, setIsProcessingTransfer] = useState(false);

  // Configuración de la API
  const API_BASE_URL = 'http://presaleslatamtest.apigw-az-us.webmethods.io/gateway/transferencias/1.0';

  // Datos simulados de usuarios y cuentas
  const users = {
    '12345678': {
      id: '12345678',
      name: 'María González',
      password: '1234',
      pin: '4567',
      accounts: [
        { number: '0001234567890', type: 'Cuenta Corriente', balance: 5000.00 },
        { number: '0001234567891', type: 'Cuenta de Ahorros', balance: 15000.00 }
      ],
      selectedAccount: 0
    },
    '87654321': {
      id: '87654321',
      name: 'Juan Pérez',
      password: '5678',
      pin: '1234',
      accounts: [
        { number: '0009876543210', type: 'Cuenta Corriente', balance: 3500.00 }
      ],
      selectedAccount: 0
    }
  };

  const [userDatabase, setUserDatabase] = useState(users);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), type === 'info' ? 3000 : 4000);
  };

  const handleLogin = (userId, password) => {
    const user = userDatabase[userId];
    if (user && user.password === password) {
      setCurrentUser(user);
      setCurrentView('dashboard');
      showNotification(`¡Bienvenido/a ${user.name}!`);
    } else {
      showNotification('Usuario o contraseña incorrectos', 'error');
    }
  };

  const handleTransfer = async () => {
    const { destinationAccount, swiftCode, amount, concept, pin } = transferData;
    
    // Validar campos básicos
    if (!destinationAccount || !amount || !concept || !pin) {
      showNotification('Por favor completa todos los campos obligatorios', 'error');
      return;
    }

    // Validar campos internacionales si están habilitados
    if (showInternationalFields && !swiftCode) {
      showNotification('Por favor completa el código SWIFT para transferencias internacionales', 'error');
      return;
    }

    // Validar formato de código SWIFT solo si está habilitado y tiene valor
    if (showInternationalFields && swiftCode && (swiftCode.length !== 8 && swiftCode.length !== 11)) {
      showNotification('El código SWIFT debe tener 8 u 11 caracteres', 'error');
      return;
    }

    if (pin !== currentUser.pin) {
      showNotification('PIN incorrecto', 'error');
      return;
    }

    const transferAmount = parseFloat(amount);
    const currentAccount = currentUser.accounts[currentUser.selectedAccount];
    
    if (transferAmount > currentAccount.balance) {
      showNotification('Saldo insuficiente', 'error');
      return;
    }

    if (transferAmount <= 0) {
      showNotification('El monto debe ser mayor a 0', 'error');
      return;
    }

    // Preparar datos para la API
    const transferPayload = {
      cuentaBeneficiario: {
        numeroCuenta: destinationAccount,
        titular: "Beneficiario",
        banco: "Banco Destino"
      },
      montoTransferencia: {
        cantidad: transferAmount,
        tipoMoneda: "USD"
      },
      tipoTransferencia: showInternationalFields ? "INTERNACIONAL" : "NACIONAL",
      codigoSwift: showInternationalFields ? swiftCode : ""
    };

    setIsProcessingTransfer(true);
    showNotification('Procesando transferencia...', 'info');

    try {
      // Llamada a la API
      const response = await fetch(`${API_BASE_URL}/transferencias`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(transferPayload)
      });

      const result = await response.json();

      if (response.ok) {
        // Transferencia exitosa
        const { transferenciaId, fechaProceso, comision, estado } = result.data;
        
        // Actualizar saldo local (simulado)
        const updatedUser = { ...currentUser };
        updatedUser.accounts[currentUser.selectedAccount].balance -= (transferAmount + comision);
        setCurrentUser(updatedUser);
        setUserDatabase(prev => ({
          ...prev,
          [currentUser.id]: updatedUser
        }));

        const transferType = showInternationalFields ? 'internacional' : 'nacional';
        const successMessage = `Transferencia ${transferType} exitosa!\nID: ${transferenciaId}\nComisión: $${comision.toFixed(2)}`;
        
        setTransferData({ destinationAccount: '', swiftCode: '', amount: '', concept: '', pin: '' });
        setShowInternationalFields(false);
        showNotification(successMessage, 'success');
        setCurrentView('dashboard');
        
      } else {
        // Error en la API
        if (result.errores && result.errores.length > 0) {
          const errorMessages = result.errores.map(error => `${error.campo}: ${error.descripcion}`).join('\n');
          showNotification(`Errores en la transferencia:\n${errorMessages}`, 'error');
        } else {
          showNotification(result.mensaje || 'Error al procesar la transferencia', 'error');
        }
      }
    } catch (error) {
      // Error de red o conexión
      console.error('Error al realizar la transferencia:', error);
      showNotification('Error de conexión. Por favor, intenta nuevamente.', 'error');
      
      // En caso de error, hacer transferencia local como fallback (modo demo)
      showNotification('Modo demo: Procesando transferencia localmente...', 'info');
      setTimeout(() => {
        const updatedUser = { ...currentUser };
        updatedUser.accounts[currentUser.selectedAccount].balance -= transferAmount;
        setCurrentUser(updatedUser);
        setUserDatabase(prev => ({
          ...prev,
          [currentUser.id]: updatedUser
        }));

        const transferType = showInternationalFields ? 'internacional' : 'nacional';
        const successMessage = `Transferencia ${transferType} completada (modo demo)\nMonto: $${transferAmount.toFixed(2)}`;
        
        setTransferData({ destinationAccount: '', swiftCode: '', amount: '', concept: '', pin: '' });
        setShowInternationalFields(false);
        showNotification(successMessage, 'success');
        setCurrentView('dashboard');
      }, 2000);
    } finally {
      setIsProcessingTransfer(false);
    }
  };

  const LoginView = () => {
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Banco Digital</h1>
            <p className="text-gray-600 mt-2">Ingresa a tu cuenta</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Documento
              </label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="12345678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                  placeholder="••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              onClick={() => handleLogin(userId, password)}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Ingresar
            </button>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 font-semibold mb-2">Cuentas de prueba:</p>
            <div className="text-xs text-gray-500 space-y-1">
              <div>Usuario: 12345678, Password: 1234</div>
              <div>Usuario: 87654321, Password: 5678</div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="text-sm font-semibold text-green-800 mb-2">🔗 Integración con API</h3>
            <div className="text-xs text-green-700 space-y-1">
              <div><strong>Endpoint:</strong> POST /transferencias</div>
              <div><strong>Autenticación:</strong> Sin autenticación requerida</div>
              <div><strong>Validaciones:</strong> SWIFT, montos, cuentas</div>
              <div><strong>Fallback:</strong> Modo demo si no hay conexión</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const DashboardView = () => {
    const currentAccount = currentUser.accounts[currentUser.selectedAccount];

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-blue-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold">¡Hola, {currentUser.name}!</h1>
              <p className="text-blue-100">Bienvenido a tu banca digital</p>
            </div>
            <button
              onClick={() => {
                setCurrentUser(null);
                setCurrentView('login');
              }}
              className="bg-blue-700 px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"
            >
              Salir
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Mis Cuentas</h2>
              {currentUser.accounts.length > 1 && (
                <select
                  value={currentUser.selectedAccount}
                  onChange={(e) => {
                    const updatedUser = { ...currentUser, selectedAccount: parseInt(e.target.value) };
                    setCurrentUser(updatedUser);
                  }}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  {currentUser.accounts.map((account, index) => (
                    <option key={index} value={index}>
                      {account.type}
                    </option>
                  ))}
                </select>
              )}
            </div>
            
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
              <p className="text-sm opacity-90">{currentAccount.type}</p>
              <p className="text-lg font-mono">{currentAccount.number}</p>
              <p className="text-3xl font-bold mt-4">
                ${currentAccount.balance.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm opacity-90 mt-1">Saldo disponible</p>
            </div>
          </div>

          <div className="grid gap-4">
            <button
              onClick={() => setCurrentView('transfer')}
              className="bg-white rounded-xl shadow-lg p-6 flex items-center space-x-4 hover:shadow-xl transition-shadow"
            >
              <div className="bg-green-100 p-3 rounded-full">
                <Send className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800">Transferir Dinero</h3>
                <p className="text-gray-600 text-sm">Envía dinero a otras cuentas</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const TransferView = () => {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-blue-600 text-white p-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="p-2 rounded-full hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold">Transferir Dinero</h1>
          </div>
        </div>

        <div className="p-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Cuenta Destino
                </label>
                <input
                  type="text"
                  value={transferData.destinationAccount}
                  onChange={(e) => setTransferData({ ...transferData, destinationAccount: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1234567890123456"
                  maxLength="20"
                  disabled={isProcessingTransfer}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Número de cuenta del beneficiario (10-20 dígitos)
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="internationalTransfer"
                    checked={showInternationalFields}
                    onChange={(e) => {
                      setShowInternationalFields(e.target.checked);
                      if (!e.target.checked) {
                        setTransferData({ ...transferData, swiftCode: '' });
                      }
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="internationalTransfer" className="text-sm font-medium text-blue-800">
                    Transferencia Internacional
                  </label>
                </div>
                <p className="text-xs text-blue-600 mt-2 ml-7">
                  Marca esta opción si deseas realizar una transferencia a un banco en el extranjero
                </p>
              </div>

              {showInternationalFields && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 space-y-4">
                  <h3 className="text-sm font-semibold text-yellow-800 mb-3">
                    📍 Información Internacional
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Código SWIFT <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={transferData.swiftCode}
                      onChange={(e) => setTransferData({ ...transferData, swiftCode: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="BOFAUS3N"
                      maxLength="11"
                      pattern="^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$"
                      disabled={isProcessingTransfer}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Código SWIFT del banco destino (8 u 11 caracteres)
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded border">
                    <h4 className="text-xs font-semibold text-gray-800 mb-2">Códigos SWIFT de Ejemplo:</h4>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div><strong>BBVACOL1</strong> - Banco BBVA Colombia</div>
                      <div><strong>BANCOUS33</strong> - Bank of America (USA)</div>
                      <div><strong>CHASUS33</strong> - JPMorgan Chase (USA)</div>
                      <div><strong>CITIUS33</strong> - Citibank (USA)</div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto a Transferir
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={transferData.amount}
                    onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                    step="0.01"
                    min="0.01"
                    max="999999999.99"
                    disabled={isProcessingTransfer}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Saldo disponible: ${currentUser?.accounts[currentUser.selectedAccount]?.balance.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  💡 Nota: Se aplicará una comisión según el tipo de transferencia
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Concepto
                </label>
                <input
                  type="text"
                  value={transferData.concept}
                  onChange={(e) => setTransferData({ ...transferData, concept: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Pago de servicios, regalo, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PIN de Seguridad
                </label>
                <input
                  type="password"
                  value={transferData.pin}
                  onChange={(e) => setTransferData({ ...transferData, pin: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••"
                  maxLength="4"
                />
                <p className="text-sm text-gray-500 mt-1">
                  PIN de prueba para {currentUser?.name}: {currentUser?.pin}
                </p>
              </div>

              <button
                onClick={handleTransfer}
                disabled={isProcessingTransfer}
                className={`w-full py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 ${
                  isProcessingTransfer 
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isProcessingTransfer ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>
                      {showInternationalFields ? 'Confirmar Transferencia Internacional' : 'Confirmar Transferencia Nacional'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center space-x-2 max-w-md ${
          notification.type === 'success' 
            ? 'bg-green-500 text-white' 
            : notification.type === 'info'
            ? 'bg-blue-500 text-white'
            : 'bg-red-500 text-white'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : notification.type === 'info' ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white flex-shrink-0"></div>
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="text-sm whitespace-pre-line">{notification.message}</span>
        </div>
      )}

      {currentView === 'login' && <LoginView />}
      {currentView === 'dashboard' && <DashboardView />}
      {currentView === 'transfer' && <TransferView />}
    </div>
  );
};

export default BankingApp;
