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
    setTimeout(() => setNotification(null), 4000);
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

  const handleTransfer = () => {
    const { destinationAccount, swiftCode, amount, concept, pin } = transferData;
    
    if (!destinationAccount || !swiftCode || !amount || !concept || !pin) {
      showNotification('Por favor completa todos los campos', 'error');
      return;
    }

    // Validar formato de código SWIFT (8 o 11 caracteres)
    if (swiftCode.length !== 8 && swiftCode.length !== 11) {
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

    // Realizar la transferencia
    const updatedUser = { ...currentUser };
    updatedUser.accounts[currentUser.selectedAccount].balance -= transferAmount;
    
    // Si la cuenta destino existe en nuestra base de datos, agregar el dinero
    const destinationUser = Object.values(userDatabase).find(user => 
      user.accounts.some(account => account.number === destinationAccount)
    );
    
    if (destinationUser) {
      const destinationAccountIndex = destinationUser.accounts.findIndex(
        account => account.number === destinationAccount
      );
      destinationUser.accounts[destinationAccountIndex].balance += transferAmount;
    }

    setCurrentUser(updatedUser);
    setUserDatabase(prev => ({
      ...prev,
      [currentUser.id]: updatedUser,
      ...(destinationUser && { [destinationUser.id]: destinationUser })
    }));

    setTransferData({ destinationAccount: '', swiftCode: '', amount: '', concept: '', pin: '' });
    showNotification(`Transferencia exitosa por ${transferAmount.toFixed(2)} a ${swiftCode}`);
    setCurrentView('dashboard');
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

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">Códigos SWIFT de Ejemplo:</h3>
            <div className="text-xs text-blue-700 space-y-1">
              <div><strong>BBVACOL1</strong> - Banco BBVA Colombia</div>
              <div><strong>BANCOUS33</strong> - Bank of America (USA)</div>
              <div><strong>CHASUS33</strong> - JPMorgan Chase (USA)</div>
              <div><strong>CITIUS33</strong> - Citibank (USA)</div>
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
                  placeholder="0009876543210"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ingresa el número de cuenta del beneficiario
                </p>
              </div>

              {/* Checkbox para habilitar transferencias internacionales */}
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

              {/* Campos internacionales - solo se muestran si el checkbox está marcado */}
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
                      placeholder="ABCDUS33XXX"
                      maxLength="11"
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
                    min="0"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Saldo disponible: ${currentUser?.accounts[currentUser.selectedAccount]?.balance.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
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
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Send className="w-5 h-5" />
                <span>
                  {showInternationalFields ? 'Confirmar Transferencia Internacional' : 'Confirmar Transferencia Nacional'}
                </span>
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
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center space-x-2 ${
          notification.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {currentView === 'login' && <LoginView />}
      {currentView === 'dashboard' && <DashboardView />}
      {currentView === 'transfer' && <TransferView />}
    </div>
  );
};

export default BankingApp;
