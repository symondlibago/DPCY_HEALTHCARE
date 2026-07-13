export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'https://dpcy-database-production.up.railway.app/api';

export const getAuthToken = () => localStorage.getItem('auth_token');
export const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const isAuthenticated = () => !!getAuthToken();

export const logout = async () => {
  const token = getAuthToken();
  if (token) {
    try {
      await fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
  window.location.href = '/';
};

export const authenticatedRequest = async (url, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, { ...options, headers });
    if (response.status === 401) logout();
    return response;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};
export const readResponse = async (res) => {
  const status = res.status;
  let text = '';
  try { text = await res.text(); } catch { text = ''; }

  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = null; }

  if (data && typeof data === 'object') {
    return {
      ok: res.ok && data.success !== false,
      status,
      data: data.data ?? data,
      message: data.message || null,
      errors: data.errors || null,
    };
  }

  // Non-JSON response (HTML error page, empty body, etc.)
  const looksHtml = /^\s*</.test(text);
  return {
    ok: false,
    status,
    data: null,
    errors: null,
    message: looksHtml
      ? `The server returned an unexpected response (HTTP ${status}). The API address may be wrong, or that endpoint isn't available on the server.`
      : (text ? text.slice(0, 300) : `Request failed (HTTP ${status}).`),
  };
};

// Flatten a validation `errors` object into a single readable string.
export const formatErrors = (errors, fallback = 'Something went wrong.') => {
  if (!errors) return fallback;
  const all = Object.values(errors).flat().filter(Boolean);
  return all.length ? all.join('\n') : fallback;
};

// Generic REST helpers built on authenticatedRequest.
const list = async (resource, params = '') => {
  const res = await authenticatedRequest(`/${resource}${params}`);
  const data = await res.json();
  return data.success ? data.data : [];
};
const create = (resource, body) => authenticatedRequest(`/${resource}`, {
  method: 'POST', body: JSON.stringify(body),
});
const update = (resource, id, body) => authenticatedRequest(`/${resource}/${id}`, {
  method: 'PUT', body: JSON.stringify(body),
});
const remove = (resource, id) => authenticatedRequest(`/${resource}/${id}`, {
  method: 'DELETE',
});

// EMPLOYEES
export const getEmployees = () => list('employees');
export const createEmployee = (data) => create('employees', data);
export const updateEmployee = (id, data) => update('employees', id, data);
export const deleteEmployee = (id) => remove('employees', id);

// SERVICES
export const getServices = (activeOnly = false) => list('services', activeOnly ? '?active_only=1' : '');
export const createService = (data) => create('services', data);
export const updateService = (id, data) => update('services', id, data);
export const deleteService = (id) => remove('services', id);

// TRANSACTIONS
export const getTransactions = (params = '') => list('transactions', params);
export const createTransaction = (data) => create('transactions', data);
export const updateTransaction = (id, data) => update('transactions', id, data);
export const deleteTransaction = (id) => remove('transactions', id);

// EXPENSES
export const getExpenses = (params = '') => list('expenses', params);
export const createExpense = (data) => create('expenses', data);
export const updateExpense = (id, data) => update('expenses', id, data);
export const deleteExpense = (id) => remove('expenses', id);

// ATTENDANCE (employee present/absent log, admin + super admin)
export const getAttendance = (params = '') => list('attendance', params);
export const getAttendanceHistory = (params = '') => list('attendance/history', params);
export const markAttendance = (employeeId, data) => create(`attendance/${employeeId}/mark`, data);

// REPORTS (admin + super admin) — returns the full summary object
export const getSalesReport = async (params = '') => {
  const res = await authenticatedRequest(`/reports/sales${params}`);
  return res.json();
};

// DISCOUNT ENROLLEES (PWD / Senior / Yakap Member registry, admin + super admin)
export const getDiscountEnrollees = (params = '') => list('discount-enrollees', params);
export const createDiscountEnrollee = (data) => create('discount-enrollees', data);
export const updateDiscountEnrollee = (id, data) => update('discount-enrollees', id, data);
export const deleteDiscountEnrollee = (id) => remove('discount-enrollees', id);
export const getDiscountEnrolleeStats = async () => {
  const res = await authenticatedRequest('/discount-enrollees/stats');
  const data = await res.json();
  return data.success ? data.data : { total: 0, by_type: { PWD: 0, Senior: 0, 'Yakap Member': 0 } };
};

// YAKAP SETTINGS (manually entered enrollee total, admin + super admin)
export const getYakapSettings = async () => {
  const res = await authenticatedRequest('/yakap-settings');
  const data = await res.json();
  return data.success ? data.data : { manual_count: 0 };
};
export const updateYakapSettings = (data) => authenticatedRequest('/yakap-settings', {
  method: 'PUT', body: JSON.stringify(data),
});

// USERS (super admin only)
export const getUsers = () => list('users');
export const resetUserPassword = (id, data) => create(`users/${id}/reset-password`, data);

// SELF-SERVICE PASSWORD CHANGE (any authenticated user)
export const changeOwnPassword = (data) => authenticatedRequest('/user/change-password', {
  method: 'POST', body: JSON.stringify(data),
});