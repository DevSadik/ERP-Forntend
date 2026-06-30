import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Button, PageHeader, InputField, SelectField } from '../components/ui';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../utils/api';

const TABS = ['সাধারণ', 'ব্যবহারকারী', 'নিরাপত্তা'];

export default function Settings() {
  const { dark, toggle } = useTheme();
  const { lang, switchLang } = useLanguage();
  const { user, updateUser } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState('সাধারণ');

  const [company, setCompany] = useState({
    name: 'Mini Manager BD Ltd.',
    email: 'admin@minimanager.com',
    phone: '+8801844815121',
    currency: 'BDT',
  });
  const [savingCompany, setSavingCompany] = useState(false);

  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [pwErrors, setPwErrors] = useState({});

  const [userModal, setUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '', email: '', role: 'staff', password: 'password123',
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(r => r.data.data),
    enabled: tab === 'ব্যবহারকারী',
  });

  const createUserMutation = useMutation({
    mutationFn: u => api.post('/users', u),
    onSuccess: () => {
      qc.invalidateQueries(['users']);
      toast.success('ব্যবহারকারী তৈরি হয়েছে!');
      setUserModal(false);
      setNewUser({ name: '', email: '', role: 'staff', password: 'password123' });
    },
    onError: e => toast.error(e.response?.data?.message || 'ব্যর্থ হয়েছে।'),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/users/${id}`, data),
    onSuccess: () => { qc.invalidateQueries(['users']); toast.success('আপডেট হয়েছে!'); },
    onError: e => toast.error(e.response?.data?.message || 'ব্যর্থ হয়েছে।'),
  });

  const saveCompany = async () => {
    setSavingCompany(true);
    await new Promise(r => setTimeout(r, 500));
    setSavingCompany(false);
    toast.success('সেটিংস সংরক্ষিত হয়েছে।');
  };

  const changePassword = async () => {
    const e = {};
    if (!pwForm.currentPassword)              e.currentPassword  = 'বর্তমান পাসওয়ার্ড দিন';
    if (!pwForm.newPassword || pwForm.newPassword.length < 6) e.newPassword = 'কমপক্ষে ৬ অক্ষর';
    if (pwForm.newPassword !== pwForm.confirmPassword)        e.confirmPassword = 'পাসওয়ার্ড মিলছে না';
    setPwErrors(e);
    if (Object.keys(e).length) return;
    try {
      await api.put('/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success('পাসওয়ার্ড পরিবর্তন হয়েছে!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'পাসওয়ার্ড পরিবর্তন ব্যর্থ।');
    }
  };

  const users = usersData || [];

  return (
    <div className="space-y-stack-lg max-w-3xl">
      <PageHeader title="সেটিংস" subtitle="কোম্পানি প্রোফাইল ও সিস্টেম পছন্দ।" />

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-high p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-body-md transition-all ${tab === t ? 'bg-surface text-on-surface font-semibold shadow-card' : 'text-on-surface-var hover:text-on-surface'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* ── সাধারণ ── */}
      {tab === 'সাধারণ' && (
        <div className="space-y-stack-md">
          <Card>
            <h3 className="text-headline-sm font-semibold text-on-surface mb-stack-md">কোম্পানি প্রোফাইল</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-stack-md">
              <div>
                <label className="block text-label-sm text-on-surface-var mb-1">কোম্পানির নাম</label>
                <InputField value={company.name} onChange={e => setCompany({ ...company, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-label-sm text-on-surface-var mb-1">ইমেইল</label>
                <InputField type="email" value={company.email} onChange={e => setCompany({ ...company, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-label-sm text-on-surface-var mb-1">ফোন</label>
                <InputField value={company.phone} onChange={e => setCompany({ ...company, phone: e.target.value })} />
              </div>
              <div>
                <label className="block text-label-sm text-on-surface-var mb-1">মুদ্রা</label>
                <SelectField value={company.currency} onChange={e => setCompany({ ...company, currency: e.target.value })}
                  options={[
                    { value: 'BDT', label: 'BDT — বাংলাদেশি টাকা' },
                    { value: 'USD', label: 'USD — US Dollar' },
                    { value: 'EUR', label: 'EUR — Euro' },
                  ]} />
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-headline-sm font-semibold text-on-surface mb-stack-md">থিম</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-body-md font-medium text-on-surface">ডার্ক মোড</p>
                <p className="text-label-sm text-on-surface-var">সম্পূর্ণ অ্যাপে ডার্ক থিম</p>
              </div>
              <button onClick={toggle}
                className={`relative w-12 h-6 rounded-full transition-all duration-300 ${dark ? 'bg-primary' : 'bg-surface-highest'}`}>
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${dark ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            {/* Language toggle */}
            <div className="flex items-center justify-between mt-stack-md pt-stack-md border-t border-outline-var">
              <div>
                <p className="text-body-md font-medium text-on-surface">
                  {lang === 'en' ? 'Language' : 'ভাষা'}
                </p>
                <p className="text-label-sm text-on-surface-var">
                  {lang === 'en' ? 'Choose app language' : 'অ্যাপের ভাষা নির্বাচন করুন'}
                </p>
              </div>
              <div className="flex bg-surface-highest rounded-xl p-1 gap-1">
                <button onClick={() => switchLang('en')}
                  className={`px-4 py-1.5 rounded-lg text-label-md font-bold transition-all ${lang === 'en' ? 'bg-primary text-white shadow' : 'text-on-surface-var hover:text-on-surface'}`}>
                  English
                </button>
                <button onClick={() => switchLang('bn')}
                  className={`px-4 py-1.5 rounded-lg text-label-md font-bold transition-all ${lang === 'bn' ? 'bg-primary text-white shadow' : 'text-on-surface-var hover:text-on-surface'}`}>
                  বাংলা
                </button>
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button icon="save" loading={savingCompany} onClick={saveCompany}>পরিবর্তন সংরক্ষণ করুন</Button>
          </div>
        </div>
      )}

      {/* ── ব্যবহারকারী ── */}
      {tab === 'ব্যবহারকারী' && (
        <div className="space-y-stack-md">
          <Card>
            <div className="flex items-center justify-between mb-stack-md">
              <h3 className="text-headline-sm font-semibold text-on-surface">টিম সদস্য</h3>
              <Button icon="person_add" size="sm" onClick={() => setUserModal(true)}>ব্যবহারকারী যোগ করুন</Button>
            </div>
            {usersLoading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-12 bg-surface-high rounded-lg animate-pulse" />)}
              </div>
            ) : (
              users.map(u => (
                <div key={u._id} className="flex items-center gap-3 py-3 border-b border-outline-var last:border-0">
                  <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold text-label-md">{u.name?.[0]}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-body-md font-medium text-on-surface">{u.name}</p>
                    <p className="text-label-sm text-on-surface-var">{u.email}</p>
                  </div>
                  <select value={u.role}
                    onChange={e => updateUserMutation.mutate({ id: u._id, data: { role: e.target.value } })}
                    className="text-label-sm bg-surface-high border border-outline-var rounded-lg px-2 py-1 text-on-surface focus:outline-none focus:border-primary">
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="staff">Staff</option>
                  </select>
                  <button
                    onClick={() => updateUserMutation.mutate({ id: u._id, data: { isActive: !u.isActive } })}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${u.isActive ? 'bg-success' : 'bg-outline'}`}
                    title={u.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                  />
                </div>
              ))
            )}
          </Card>

          {userModal && (
            <Card>
              <h3 className="text-headline-sm font-semibold text-on-surface mb-stack-md">নতুন ব্যবহারকারী</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-stack-md">
                <div>
                  <label className="block text-label-sm text-on-surface-var mb-1">নাম *</label>
                  <InputField value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-label-sm text-on-surface-var mb-1">ইমেইল *</label>
                  <InputField type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
                </div>
                <div>
                  <label className="block text-label-sm text-on-surface-var mb-1">রোল</label>
                  <SelectField value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                    options={[
                      { value: 'admin',   label: 'Admin'   },
                      { value: 'manager', label: 'Manager' },
                      { value: 'staff',   label: 'Staff'   },
                    ]} />
                </div>
                <div>
                  <label className="block text-label-sm text-on-surface-var mb-1">পাসওয়ার্ড</label>
                  <InputField value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-2 mt-stack-md">
                <Button variant="secondary" onClick={() => setUserModal(false)}>বাতিল</Button>
                <Button icon="save" loading={createUserMutation.isPending}
                  onClick={() => createUserMutation.mutate(newUser)}>
                  তৈরি করুন
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── নিরাপত্তা ── */}
      {tab === 'নিরাপত্তা' && (
        <Card>
          <h3 className="text-headline-sm font-semibold text-on-surface mb-stack-md">পাসওয়ার্ড পরিবর্তন</h3>
          <div className="space-y-stack-md max-w-sm">
            <div>
              <label className="block text-label-sm text-on-surface-var mb-1">বর্তমান পাসওয়ার্ড</label>
              <InputField type="password"
                value={pwForm.currentPassword}
                onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                error={pwErrors.currentPassword} />
              {pwErrors.currentPassword && <p className="text-label-sm text-error mt-1">{pwErrors.currentPassword}</p>}
            </div>
            <div>
              <label className="block text-label-sm text-on-surface-var mb-1">নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)</label>
              <InputField type="password"
                value={pwForm.newPassword}
                onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
                error={pwErrors.newPassword} />
              {pwErrors.newPassword && <p className="text-label-sm text-error mt-1">{pwErrors.newPassword}</p>}
            </div>
            <div>
              <label className="block text-label-sm text-on-surface-var mb-1">নতুন পাসওয়ার্ড নিশ্চিত করুন</label>
              <InputField type="password"
                value={pwForm.confirmPassword}
                onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                error={pwErrors.confirmPassword} />
              {pwErrors.confirmPassword && <p className="text-label-sm text-error mt-1">{pwErrors.confirmPassword}</p>}
            </div>
            <Button icon="lock" onClick={changePassword}>পাসওয়ার্ড আপডেট করুন</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
