import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '../lib/supabaseClient.js'
import mascot from '../assets/login-mascot-figma.svg'
import './Login.css'

export default function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState(null)

  async function handleLogin(e) {
    e.preventDefault()
    setError(null)

    const { data, error: signError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (signError) {
      setError('Email of wachtwoord klopt niet')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profile?.role === 'child') navigate('/dashboard/kind')
    else if (profile?.role === 'parent') navigate('/dashboard/ouder')
    else if (profile?.role === 'kine') navigate('/dashboard/kine')
  }

  return (
    <div className="login-page">
      <div className="login-page__panel login-page__panel--form">
        <div className="login-page__inner">
          <p className="login-page__logo">nimbli</p>
          <h1 className="login-page__title">Samen sterk in thuisrevalidatie.</h1>
          <p className="login-page__lead">
            Log in of meld je aan met een code die je van de kinesist hebt gekregen.
          </p>

          <form className="login-page__form" onSubmit={handleLogin} noValidate>
            <div className="login-page__field">
              <label className="login-page__label" htmlFor="login-email">
                Email adres
              </label>
              <input
                id="login-email"
                className="login-page__input"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="Email adres"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="login-page__field">
              <label className="login-page__label" htmlFor="login-password">
                Wachtwoord
              </label>
              <input
                id="login-password"
                className="login-page__input"
                type="password"
                name="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <label className="login-page__remember">
              <input
                className="login-page__remember-input"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span className="login-page__remember-box" aria-hidden>
                <svg
                  className="login-page__remember-check"
                  viewBox="0 0 12 10"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden
                >
                  <path
                    d="M1 5.2L4.2 8.4L11 1.6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="login-page__remember-text">Onthoud mij</span>
            </label>

            {error ? <p className="login-page__error">{error}</p> : null}

            <button className="login-page__btn login-page__btn--primary" type="submit">
              Inloggen
            </button>

            <button
              className="login-page__btn login-page__btn--secondary"
              type="button"
              onClick={() => navigate('/register')}
            >
              Aanmelden met code
            </button>

            <p className="login-page__forgot">
              <a href="#">Wachtwoord vergeten? Klik hier</a>
            </p>
          </form>

          <div className="login-page__divider">
            <button
              className="login-page__btn login-page__btn--primary"
              type="button"
              onClick={() => navigate('/register/kine')}
            >
              Registreer je praktijk
            </button>
          </div>

          <div className="login-page__footer">
            <a href="#">Privacy</a>
            <a href="#">Gebruiksvoorwaarden</a>
          </div>
        </div>
      </div>

      <div className="login-page__panel login-page__panel--visual" aria-hidden>
        <div className="login-page__visual-bg" />
        <div className="login-page__mascot-wrap">
          <img
            className="login-page__mascot"
            src={mascot}
            alt=""
          />
        </div>
      </div>
    </div>
  )
}
