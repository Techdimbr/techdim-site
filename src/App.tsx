import { useEffect, useMemo, useState } from 'react'
import './App.css'

type AnalysisResult = {
  timestamp: string
  browser: string
  os: string
  language: string
  timezone: string
  connection: string
  speedEstimate: string
  webrtc: string
  dns: string
  fingerprint: string
  privacyNote: string
}

const services = [
  'Consultoria em Segurança Cibernética',
  'Auditoria de Privacidade e LGPD',
  'Hardening de Ambientes Web e Cloud',
  'Monitoramento de Superfície de Ataque',
]

const cases = [
  'Mapeamento de exposição digital para empresa de logística',
  'Plano de resposta a incidentes para operação varejista',
  'Aprimoramento de postura de segurança para e-commerce',
]

const resources = [
  'Checklist de segurança para pequenas e médias empresas',
  'Guia rápido de privacidade para times de produto',
  'Boas práticas para proteção de contas corporativas',
]

const blogPosts = [
  'Como reduzir risco de phishing em operações distribuídas',
  'O que monitorar no navegador para prevenir vazamentos',
  'Privacidade por padrão: decisões técnicas que ajudam o negócio',
]

function getRouteFromHash(hash: string): 'home' | 'privacy' {
  return hash.startsWith('#/privacidade') ? 'privacy' : 'home'
}

function deriveOs(userAgent: string) {
  if (/windows/i.test(userAgent)) return 'Windows'
  if (/android/i.test(userAgent)) return 'Android'
  if (/iphone|ipad|ipod/i.test(userAgent)) return 'iOS'
  if (/mac os/i.test(userAgent)) return 'macOS'
  if (/linux/i.test(userAgent)) return 'Linux'
  return 'Sistema não identificado'
}

async function buildFingerprint() {
  const payload = [
    navigator.userAgent,
    navigator.language,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    String(navigator.hardwareConcurrency ?? 'n/a'),
    String((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 'n/a'),
    `${screen.width}x${screen.height}`,
    String(screen.colorDepth),
  ].join('|')

  if (!window.crypto?.subtle) {
    return 'Fingerprint local indisponível (SubtleCrypto não suportado)'
  }

  const hashBuffer = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload))
  const digest = Array.from(new Uint8Array(hashBuffer))
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')

  return `${digest.slice(0, 16)}… (hash local)`
}

async function inspectWebRtc() {
  if (!('RTCPeerConnection' in window)) {
    return 'WebRTC indisponível neste navegador'
  }

  return new Promise<string>((resolve) => {
    const candidateTypes = new Set<string>()
    const connection = new RTCPeerConnection({ iceServers: [] })

    connection.createDataChannel('techdim-local-check')

    connection.onicecandidate = (event) => {
      const candidate = event.candidate?.candidate
      if (!candidate) {
        return
      }

      const typeMatch = candidate.match(/ typ ([a-z]+)/i)
      if (typeMatch?.[1]) {
        candidateTypes.add(typeMatch[1])
      }
    }

    connection
      .createOffer()
      .then((offer) => connection.setLocalDescription(offer))
      .catch(() => {
        resolve('WebRTC disponível, mas sem coleta de candidatos')
      })

    window.setTimeout(() => {
      connection.close()
      if (candidateTypes.size === 0) {
        resolve('Nenhum candidato exposto (proteção de privacidade ativa)')
        return
      }
      resolve(`Tipos de candidato: ${Array.from(candidateTypes).join(', ')}`)
    }, 1200)
  })
}

function App() {
  const [route, setRoute] = useState<'home' | 'privacy'>(getRouteFromHash(window.location.hash))
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)

  useEffect(() => {
    const updateRoute = () => setRoute(getRouteFromHash(window.location.hash))
    window.addEventListener('hashchange', updateRoute)
    return () => window.removeEventListener('hashchange', updateRoute)
  }, [])

  const reportText = useMemo(() => {
    if (!analysis) {
      return ''
    }

    return [
      'TECHDIM - Relatório Local de Navegador e Rede',
      `Data/Hora: ${analysis.timestamp}`,
      `Navegador: ${analysis.browser}`,
      `Sistema operacional: ${analysis.os}`,
      `Idioma: ${analysis.language}`,
      `Fuso horário: ${analysis.timezone}`,
      `Conexão: ${analysis.connection}`,
      `Velocidade estimada: ${analysis.speedEstimate}`,
      `WebRTC: ${analysis.webrtc}`,
      `DNS: ${analysis.dns}`,
      `Fingerprint local: ${analysis.fingerprint}`,
      '',
      analysis.privacyNote,
    ].join('\n')
  }, [analysis])

  const runClientAnalysis = async () => {
    setLoadingAnalysis(true)

    const connection = (navigator as Navigator & {
      connection?: {
        effectiveType?: string
        downlink?: number
        rtt?: number
        saveData?: boolean
      }
    }).connection

    const browser = navigator.userAgent
    const os = deriveOs(browser)
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const speedEstimate = connection?.downlink
      ? `~${connection.downlink.toFixed(1)} Mbps (estimativa do navegador)`
      : 'Estimativa de banda indisponível neste navegador'

    const connectionText = [
      connection?.effectiveType ? `Tipo: ${connection.effectiveType}` : 'Tipo indisponível',
      connection?.rtt ? `RTT: ${connection.rtt} ms` : 'RTT indisponível',
      connection?.saveData ? 'Economia de dados ativa' : 'Economia de dados não reportada',
    ].join(' • ')

    const [fingerprint, webrtc] = await Promise.all([buildFingerprint(), inspectWebRtc()])

    setAnalysis({
      timestamp: new Date().toLocaleString('pt-BR'),
      browser,
      os,
      language: navigator.language,
      timezone,
      connection: connectionText,
      speedEstimate,
      webrtc,
      dns: `Host atual: ${window.location.hostname}. DNS detalhado não é exposto por API web sem backend.`,
      fingerprint,
      privacyNote:
        'Todos os dados acima são processados apenas no navegador. Nenhum dado é enviado, persistido ou compartilhado com backend/Firebase.',
    })

    setLoadingAnalysis(false)
  }

  const downloadLocalReport = () => {
    if (!reportText) {
      return
    }

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `techdim-relatorio-local-${Date.now()}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (route === 'privacy') {
    return (
      <main className="page-wrap">
        <header className="topbar">
          <a className="brand" href="#/">
            TECHDIM
          </a>
          <a className="menu-link" href="#/">
            Voltar ao site
          </a>
        </header>

        <section className="section policy">
          <h1>Política de Privacidade (Site Público)</h1>
          <p>
            Este site foi desenvolvido para operar em ambiente estático (GitHub Pages). As análises exibidas
            no painel técnico são executadas localmente no navegador.
          </p>
          <ul>
            <li>Não persistimos IP, GPS, fingerprint, leads ou dados pessoais em backend.</li>
            <li>Não utilizamos Firebase para coleta de visitantes nesta versão pública.</li>
            <li>Não há integrações com pagamentos, webhooks, automações privadas ou APIs com segredo.</li>
            <li>Contato institucional ocorre por canais externos (WhatsApp, e-mail e redes sociais).</li>
          </ul>
          <p>
            Para dúvidas sobre privacidade, entre em contato pelo e-mail{' '}
            <a href="mailto:contato@techdim.com.br">contato@techdim.com.br</a>.
          </p>
        </section>
      </main>
    )
  }

  return (
    <main className="page-wrap">
      <header className="topbar">
        <a className="brand" href="#/">
          TECHDIM
        </a>
        <nav className="menu">
          <a href="#servicos">Serviços</a>
          <a href="#sobre">Sobre</a>
          <a href="#cases">Cases</a>
          <a href="#recursos">Recursos</a>
          <a href="#blog">Blog</a>
          <a href="#contato">Contato</a>
          <a href="#/privacidade">Privacidade</a>
        </nav>
      </header>

      <section className="hero section" id="inicio">
        <p className="chip">Segurança • Privacidade • Inteligência Digital</p>
        <h1>TECHDIM</h1>
        <p>
          Soluções em cibersegurança e privacidade com abordagem prática para ambientes digitais modernos.
        </p>
        <div className="hero-actions">
          <a href="#contato" className="btn btn-primary">
            Falar com a TECHDIM
          </a>
          <a href="#scanner" className="btn btn-outline">
            Executar análise local
          </a>
        </div>
      </section>

      <section className="section" id="servicos">
        <h2>Serviços</h2>
        <div className="grid">
          {services.map((service) => (
            <article key={service} className="card">
              <h3>{service}</h3>
              <p>Entrega orientada a risco, governança e execução em cenários reais.</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="sobre">
        <h2>Sobre</h2>
        <p>
          A TECHDIM atua na proteção de operações digitais, conectando estratégia, conformidade e execução
          técnica para elevar a maturidade de segurança das organizações.
        </p>
      </section>

      <section className="section" id="cases">
        <h2>Cases & Projetos</h2>
        <div className="grid compact">
          {cases.map((item) => (
            <article key={item} className="card">
              <p>{item}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="recursos">
        <h2>Recursos</h2>
        <div className="grid compact">
          {resources.map((resource) => (
            <article key={resource} className="card">
              <p>{resource}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="blog">
        <h2>Blog & Conteúdo</h2>
        <div className="grid compact">
          {blogPosts.map((post) => (
            <article key={post} className="card">
              <p>{post}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section scanner" id="scanner">
        <h2>Analisador local de segurança e privacidade</h2>
        <p>
          Este painel funciona 100% no navegador. Nenhum resultado é enviado para servidor, banco de dados ou
          ferramentas de terceiros.
        </p>

        <div className="hero-actions">
          <button className="btn btn-primary" type="button" onClick={runClientAnalysis} disabled={loadingAnalysis}>
            {loadingAnalysis ? 'Analisando…' : 'Executar análise local'}
          </button>
          <button className="btn btn-outline" type="button" onClick={downloadLocalReport} disabled={!analysis}>
            Baixar relatório local (.txt)
          </button>
          <button className="btn btn-outline" type="button" onClick={() => window.print()} disabled={!analysis}>
            Gerar PDF local (impressão)
          </button>
        </div>

        {analysis && (
          <div className="analysis-results">
            <p>
              <strong>Navegador:</strong> {analysis.browser}
            </p>
            <p>
              <strong>Sistema:</strong> {analysis.os}
            </p>
            <p>
              <strong>Idioma/Fuso:</strong> {analysis.language} • {analysis.timezone}
            </p>
            <p>
              <strong>Conexão:</strong> {analysis.connection}
            </p>
            <p>
              <strong>Velocidade:</strong> {analysis.speedEstimate}
            </p>
            <p>
              <strong>WebRTC:</strong> {analysis.webrtc}
            </p>
            <p>
              <strong>DNS:</strong> {analysis.dns}
            </p>
            <p>
              <strong>Fingerprint:</strong> {analysis.fingerprint}
            </p>
            <p className="privacy-note">{analysis.privacyNote}</p>
          </div>
        )}
      </section>

      <section className="section" id="contato">
        <h2>Contato</h2>
        <div className="contact-links">
          <a href="https://wa.me/5519999999999" target="_blank" rel="noreferrer">
            WhatsApp
          </a>
          <a href="mailto:contato@techdim.com.br">E-mail</a>
          <a href="https://www.linkedin.com/company/techdim" target="_blank" rel="noreferrer">
            LinkedIn
          </a>
          <a href="https://www.instagram.com/techdim" target="_blank" rel="noreferrer">
            Instagram
          </a>
        </div>
      </section>

      <footer className="footer">
        <p>© {new Date().getFullYear()} TECHDIM • Site público estático para GitHub Pages</p>
      </footer>
    </main>
  )
}

export default App
