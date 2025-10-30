'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/app/store/authStore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import {
    faArrowLeft,
    faLock,
    faShieldAlt,
    faEye,
    faEyeSlash,
    faCheckCircle,
    faExclamationCircle,
    faCheck,
    faTimes,
    faSpinner,
} from '@fortawesome/free-solid-svg-icons';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface PasswordStrength {
    score: number;
    feedback: string;
    isValid: boolean;
}

export default function AccountSecurityPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const [qrCode,setQrCode]=useState("")

    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    });

    const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
        score: 0,
        feedback: '',
        isValid: false,
    });

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [sessions, setSessions] = useState<any[]>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (!user) {
            router.push('/login');
        }
    }, [user, router]);

    // 獲取安全信息
    useEffect(() => {
        const fetchSecurityInfo = async () => {
            try {
                const response = await fetch(`${API_URL}/auth/security-info`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setTwoFactorEnabled(data.twoFactorEnabled);
                    setSessions(data.sessions || []);
                }
            } catch (error) {
                console.error('獲取安全信息失敗:', error);
            }
        };

        if (token && mounted) {
            fetchSecurityInfo();
        }
    }, [token, mounted]);

    if (!mounted || !user) {
        return null;
    }

    // 檢查密碼強度
    const checkPasswordStrength = (password: string): PasswordStrength => {
        let score = 0;
        let feedback = '';

        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
        if (/\d/.test(password)) score++;
        if (/[!@#$%^&*]/.test(password)) score++;

        const feedbackMessages = [
            '密碼太弱',
            '密碼較弱',
            '密碼中等',
            '密碼較強',
            '密碼非常強',
        ];

        feedback = feedbackMessages[Math.min(score, 4)];
        const isValid = score >= 2;

        return { score: Math.min(score, 4), feedback, isValid };
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));

        if (name === 'newPassword') {
            setPasswordStrength(checkPasswordStrength(value));
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (formData.newPassword !== formData.confirmPassword) {
            setError('新密碼不相符');
            return;
        }

        if (!passwordStrength.isValid) {
            setError('密碼強度不足');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/auth/change-password`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword,
                })
            });

            if (response.ok) {
                setSuccess('密碼已成功更改');
                setFormData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                });

                setTimeout(() => {
                    setSuccess('');
                }, 3000);
            } else {
                const errorData = await response.json();
                setError(errorData.message || '密碼更改失敗');
            }
        } catch (err) {
            setError('密碼更改失敗，請稍後重試');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleTwoFactor = async () => {
        if (twoFactorEnabled) {
            // 禁用 2FA
            try {
                const response = await fetch(`${API_URL}/auth/2fa/disable`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    setTwoFactorEnabled(false);
                    setSuccess('雙因子認證已禁用');
                }
            } catch (err) {
                setError('禁用失敗');
            }
        } else {
            setLoading(false)

            try{
                const response=await fetch(`${API_URL}/auth/2fa/generate`,{
                    method: 'POST',
                    headers:{
                        'Authorization':`Bearer ${token}`,
                        'Content-Type':'application/json'
                    }
                });
                if(response.ok){
                    const data = await response.json();
                    setQrCode(data.qrCoda);
                    setShowTwoFactorModal(true);
                }else{
                    setError("生成失敗")
                }
            }catch(err){
                setError("生成失敗")

            }finally{
                setLoading(false)
            }
        }
    };

    const handleVerify2FA = async () => {
        try {
            const response = await fetch(`${API_URL}/auth/2fa/verify`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ code: twoFactorCode })
            });

            if (response.ok) {
                setTwoFactorEnabled(true);
                setShowTwoFactorModal(false);
                setTwoFactorCode('');
                setSuccess('雙因子認證已啟用');
            } else {
                setError('驗證碼不正確');
            }
        } catch (err) {
            setError('驗證失敗');
        }
    };

    const handleLogoutSession = async (sessionId: string) => {
        try {
            const response = await fetch(`${API_URL}/auth/logout-session/${sessionId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                setSessions(sessions.filter(s => s.id !== sessionId));
                setSuccess('已登出該設備');
            }
        } catch (err) {
            setError('登出失敗');
        }
    };

    const getPasswordStrengthColor = () => {
        if (passwordStrength.score === 0) return 'bg-gray-200';
        if (passwordStrength.score === 1) return 'bg-red-500';
        if (passwordStrength.score === 2) return 'bg-orange-500';
        if (passwordStrength.score === 3) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    return (
        <div className="min-h-screen bg-white">
            {/* 頂部導航 */}
            <div className="sticky top-0 bg-white border-b border-gray-200 z-40">
                <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-gray-100 rounded-full transition"
                    >
                        <FontAwesomeIcon icon={faArrowLeft} className="text-xl" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900">帳號安全</h1>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-8">
                {/* 提示信息 */}
                {success && (
                    <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                        <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 text-lg" />
                        <p className="text-green-700 font-semibold">{success}</p>
                    </div>
                )}

                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                        <FontAwesomeIcon icon={faExclamationCircle} className="text-red-600 text-lg" />
                        <p className="text-red-700 font-semibold">{error}</p>
                    </div>
                )}

                {/* 更改密碼區 */}
                <div className="bg-white border border-gray-200 rounded-xl p-8 mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <FontAwesomeIcon icon={faLock} className="text-blue-600 text-xl" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">更改密碼</h2>
                            <p className="text-gray-600 text-sm">定期更改密碼以保護你的帳號安全</p>
                        </div>
                    </div>

                    <form onSubmit={handleChangePassword} className="space-y-6">
                        {/* 當前密碼 */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                當前密碼
                            </label>
                            <div className="relative">
                                <input
                                    type={showPasswords.current ? 'text' : 'password'}
                                    name="currentPassword"
                                    value={formData.currentPassword}
                                    onChange={handlePasswordChange}
                                    placeholder="輸入你的當前密碼"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswords(prev => ({
                                        ...prev,
                                        current: !prev.current
                                    }))}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-900"
                                >
                                    <FontAwesomeIcon icon={showPasswords.current ? faEyeSlash : faEye} />
                                </button>
                            </div>
                        </div>

                        {/* 新密碼 */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                新密碼
                            </label>
                            <div className="relative">
                                <input
                                    type={showPasswords.new ? 'text' : 'password'}
                                    name="newPassword"
                                    value={formData.newPassword}
                                    onChange={handlePasswordChange}
                                    placeholder="輸入新密碼"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswords(prev => ({
                                        ...prev,
                                        new: !prev.new
                                    }))}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-900"
                                >
                                    <FontAwesomeIcon icon={showPasswords.new ? faEyeSlash : faEye} />
                                </button>
                            </div>

                            {/* 密碼強度指示器 */}
                            {formData.newPassword && (
                                <div className="mt-3 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${getPasswordStrengthColor()} transition-all duration-300`}
                                                style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                                            />
                                        </div>
                                        <span className={`text-sm font-semibold ${passwordStrength.score <= 1 ? 'text-red-600' :
                                            passwordStrength.score === 2 ? 'text-orange-600' :
                                                passwordStrength.score === 3 ? 'text-yellow-600' :
                                                    'text-green-600'
                                            }`}>
                                            {passwordStrength.feedback}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-600">
                                        提示：使用大小寫字母、數字和特殊符號可增強密碼強度
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* 確認密碼 */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                確認新密碼
                            </label>
                            <div className="relative">
                                <input
                                    type={showPasswords.confirm ? 'text' : 'password'}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handlePasswordChange}
                                    placeholder="再次輸入新密碼"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswords(prev => ({
                                        ...prev,
                                        confirm: !prev.confirm
                                    }))}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-900"
                                >
                                    <FontAwesomeIcon icon={showPasswords.confirm ? faEyeSlash : faEye} />
                                </button>
                            </div>

                            {/* 密碼匹配指示 */}
                            {formData.confirmPassword && (
                                <div className="mt-2 flex items-center gap-2">
                                    <FontAwesomeIcon
                                        icon={formData.newPassword === formData.confirmPassword ? faCheck : faTimes}
                                        className={formData.newPassword === formData.confirmPassword ? 'text-green-600' : 'text-red-600'}
                                    />
                                    <span className={formData.newPassword === formData.confirmPassword ? 'text-green-600 text-sm' : 'text-red-600 text-sm'}>
                                        {formData.newPassword === formData.confirmPassword ? '密碼相符' : '密碼不相符'}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* 保存按鈕 */}
                        {formData.newPassword && !passwordStrength.isValid && (
                            <p className="text-red-600 text-sm mb-3">❌ 密碼強度不足，需要大小寫字母、數字和特殊符號</p>
                        )}
                        <button
                            type="submit"
                            disabled={loading || !passwordStrength.isValid || formData.newPassword !== formData.confirmPassword}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                    更新中...
                                </>
                            ) : (
                                '更新密碼'
                            )}
                        </button>
                    </form>
                </div>

                {/* 雙因子認證 */}
                <div className="bg-white border border-gray-200 rounded-xl p-8 mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <FontAwesomeIcon icon={faShieldAlt} className="text-purple-600 text-xl" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">雙重認證</h2>
                                <p className="text-gray-600 text-sm">
                                    {twoFactorEnabled ? '已啟用 - 使用額外代碼登入' : '尚未啟用 - 增強帳號安全'}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleToggleTwoFactor}
                            className={`px-6 py-2 rounded-lg font-semibold transition ${twoFactorEnabled
                                ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                                : 'bg-green-600 text-white hover:bg-green-700'
                                }`}
                        >
                            {twoFactorEnabled ? '禁用' : '啟用'}
                        </button>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <p className="text-gray-700 text-sm leading-relaxed">
                            {twoFactorEnabled
                                ? '雙重認證已啟用。登入時，除了密碼外，還需要輸入來自認證應用的代碼。'
                                : '啟用雙重認證後，登入時將需要使用認證應用生成的代碼，大大提高帳號安全性。'}
                        </p>
                    </div>
                </div>

                {/* 活躍的設備 */}
                <div className="bg-white border border-gray-200 rounded-xl p-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">活躍的設備</h2>

                    {sessions.length > 0 ? (
                        <div className="space-y-4">
                            {sessions.map((session) => (
                                <div key={session.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900">{session.deviceName}</p>
                                        <p className="text-sm text-gray-600 mt-1">{session.browser}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {session.location} • 最後活動：{new Date(session.lastActive).toLocaleDateString('zh-TW')}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => handleLogoutSession(session.id)}
                                        className="px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 font-semibold text-sm transition"
                                    >
                                        登出
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-600 text-center py-8">沒有其他活躍設備</p>
                    )}
                </div>
            </div>

            {showTwoFactorModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-8">
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">啟用雙因子認證</h3>

                        {qrCode && (
                            <div className="mb-6 flex justify-center">
                                <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
                            </div>
                        )}

                        <p className="text-gray-600 mb-6">
                            使用 Google Authenticator 或 Microsoft Authenticator 掃描上方二維碼，
                            然後輸入應用中顯示的 6 位數代碼：
                        </p>

                        <input
                            type="text"
                            value={twoFactorCode}
                            onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            maxLength={6}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-center text-2xl tracking-widest mb-6"
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowTwoFactorModal(false)}
                                className="flex-1 px-4 py-3 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 font-semibold transition"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleVerify2FA}
                                disabled={twoFactorCode.length !== 6}
                                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition disabled:opacity-50"
                            >
                                驗證
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}