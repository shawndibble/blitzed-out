import { useState, FormEvent, ChangeEvent } from 'react';
import { Box, Button, TextField, Link, Alert, CircularProgress } from '@mui/material';
import { useAuth } from '@/hooks/useAuth';
import { t } from 'i18next';
import { Trans } from 'react-i18next';

interface RegisterFormProps {
  onToggleForm: (view: string) => void;
  onSuccess?: () => void;
  isAnonymous?: boolean;
}

export default function RegisterForm({
  onToggleForm,
  onSuccess,
  isAnonymous = false,
}: RegisterFormProps): JSX.Element {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const { register, convertToRegistered } = useAuth();

  const validateForm = (): boolean => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      if (isAnonymous) {
        await convertToRegistered(email, password);
      } else {
        await register(email, password, displayName);
      }
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!isAnonymous && (
        <TextField
          margin="normal"
          required
          fullWidth
          id="displayName"
          label={t('displayName')}
          name="displayName"
          autoFocus
          value={displayName}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setDisplayName(e.target.value)}
        />
      )}

      <TextField
        margin="normal"
        required
        fullWidth
        id="email"
        label={t('email')}
        name="email"
        autoComplete="email"
        autoFocus={isAnonymous}
        value={email}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
      />

      <TextField
        margin="normal"
        required
        fullWidth
        name="password"
        label={t('password')}
        type="password"
        id="password"
        autoComplete="new-password"
        value={password}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
      />

      <TextField
        margin="normal"
        required
        fullWidth
        name="confirmPassword"
        label={t('confirmPassword')}
        type="password"
        id="confirmPassword"
        value={confirmPassword}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
      />

      <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={loading}>
        {loading ? (
          <CircularProgress size={24} />
        ) : (
          <Trans i18nKey={isAnonymous ? 'convertAccount' : 'createAccount'} />
        )}
      </Button>

      {!isAnonymous && (
        <Box sx={{ textAlign: 'center' }}>
          <Link component="button" variant="body2" onClick={() => onToggleForm('login')}>
            <Trans i18nKey="alreadyHaveAccount" /> <Trans i18nKey="signIn" />
          </Link>
        </Box>
      )}
    </Box>
  );
}
