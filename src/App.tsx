import { useEffect, useState } from 'react'
import { ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3, Cloud, CloudFog, CloudLightning, CloudRain, CloudSun, Database, Droplets, ExternalLink, FileText, Linkedin, Mail, MapPin, Menu, RefreshCw, Sun, Table2, Wind, X } from 'lucide-react'

const nav = [['About','about'],['Skills','skills'],['Experience','experience'],['Projects','projects'],['Education','education'],['Contact','contact']]


const places = [
  { name: 'Chennai', latitude: 13.0827, longitude: 80.2707 },
  { name: 'Coimbatore', latitude: 11.0168, longitude: 76.9558 },
  { name: 'Madurai', latitude: 9.9252, longitude: 78.1198 },
  { name: 'Tiruchirappalli', latitude: 10.7905, longitude: 78.7047 },
  { name: 'Salem', latitude: 11.6643, longitude: 78.146 },
  { name: 'Tirunelveli', latitude: 8.7139, longitude: 77.7567 },
]

type WeatherResult = {
  current: { time: string; temperature_2m: number; relative_humidity_2m: number; wind_speed_10m: number; weather_code: number }
  daily: { time: string[]; weather_code: number[]; temperature_2m_max: number[]; temperature_2m_min: number[]; precipitation_probability_max: number[] }
  timezone: string
}

function weatherDescription(code: number) {
  if (code === 0) return 'Clear sky'
  if (code === 1) return 'Mainly clear'
  if (code === 2) return 'Partly cloudy'
  if (code === 3) return 'Overcast'
  if (code === 45 || code === 48) return 'Fog'
  if (code >= 51 && code <= 57) return 'Drizzle'
  if (code >= 61 && code <= 67) return 'Rain'
  if (code >= 71 && code <= 77) return 'Snow'
  if (code >= 80 && code <= 82) return 'Rain showers'
  if (code >= 85 && code <= 86) return 'Snow showers'
  if (code >= 95) return 'Thunderstorm'
  return 'Conditions unavailable'
}

function WeatherIcon({ code, size = 20 }: { code: number; size?: number }) {
  if (code === 0) return <Sun size={size} aria-hidden="true" />
  if (code === 1 || code === 2) return <CloudSun size={size} aria-hidden="true" />
  if (code === 45 || code === 48) return <CloudFog size={size} aria-hidden="true" />
  if (code >= 95) return <CloudLightning size={size} aria-hidden="true" />
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return <CloudRain size={size} aria-hidden="true" />
  return <Cloud size={size} aria-hidden="true" />
}

function WeatherDashboard() {
  const [placeName, setPlaceName] = useState(places[0].name)
  const [weather, setWeather] = useState<WeatherResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const place = places.find((item) => item.name === placeName) ?? places[0]

  useEffect(() => {
    const controller = new AbortController()
    const params = new URLSearchParams({
      latitude: String(place.latitude),
      longitude: String(place.longitude),
      current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
      timezone: 'Asia/Kolkata',
      forecast_days: '5',
      temperature_unit: 'celsius',
      wind_speed_unit: 'kmh',
    })

    setLoading(true)
    setError('')
    setWeather(null)
    fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Weather service is temporarily unavailable.')
        const result = await response.json() as WeatherResult & { error?: boolean }
        if (result.error || !result.current || !result.daily?.time?.length || !Array.isArray(result.daily.precipitation_probability_max) || !Array.isArray(result.daily.temperature_2m_max) || !Array.isArray(result.daily.temperature_2m_min)) throw new Error('Weather data is not available for this location right now.')
        return result
      })
      .then(setWeather)
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return
        setError(requestError instanceof Error && !(requestError instanceof TypeError) ? requestError.message : 'Could not reach the weather service. Check your connection and try again.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [place, refreshKey])

  const updatedAt = weather?.current.time
    ? new Date(`${weather.current.time}:00+05:30`).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })
    : ''

  return <div className="weather-dashboard">
    <div className="weather-toolbar"><label htmlFor="weather-location">Tamil Nadu location</label><div className="weather-controls"><MapPin size={15} aria-hidden="true"/><select id="weather-location" value={placeName} onChange={(event) => setPlaceName(event.target.value)}>{places.map((item) => <option key={item.name}>{item.name}</option>)}</select><button type="button" className="weather-refresh" onClick={() => setRefreshKey((value) => value + 1)} aria-label="Refresh weather data" disabled={loading}><RefreshCw size={15} aria-hidden="true"/></button></div></div>
    {loading && <p className="weather-state" role="status">Loading current conditions and forecast…</p>}
    {!loading && error && <div className="weather-error" role="alert"><p>{error}</p><button type="button" onClick={() => setRefreshKey((value) => value + 1)}>Try again</button></div>}
    {weather && <>
      <div className="weather-current"><div className="weather-summary"><span className="weather-condition-icon"><WeatherIcon code={weather.current.weather_code} size={25}/></span><div><span className="weather-condition">{weatherDescription(weather.current.weather_code)}</span><strong>{Math.round(weather.current.temperature_2m)}°C</strong><span className="weather-city">{place.name}, Tamil Nadu</span></div></div><div className="weather-metrics"><div><Droplets size={16} aria-hidden="true"/><span>Humidity</span><b>{weather.current.relative_humidity_2m}%</b></div><div><Wind size={16} aria-hidden="true"/><span>Wind</span><b>{Math.round(weather.current.wind_speed_10m)} km/h</b></div></div></div>
      <div className="weather-forecast"><div className="weather-forecast-heading"><h4>5-day forecast</h4><span>Daily range · precipitation chance</span></div><div className="forecast-grid">{weather.daily.time.map((date, index) => {
        const day = new Date(`${date}T12:00:00+05:30`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', timeZone: 'Asia/Kolkata' })
        const chance = weather.daily.precipitation_probability_max[index] ?? 0
        return <div className="forecast-day" key={date}><span className="forecast-date">{day}</span><WeatherIcon code={weather.daily.weather_code[index]} size={19}/><span className="forecast-range">{Math.round(weather.daily.temperature_2m_max[index])}° <i/> {Math.round(weather.daily.temperature_2m_min[index])}°</span><div className="precipitation"><span>Rain</span><b>{chance}%</b><div className="precipitation-track"><i style={{ width: `${Math.max(0, Math.min(chance, 100))}%` }}/></div></div></div>
      })}</div></div>
      <div className="weather-attribution"><span>Source: <a href="https://open-meteo.com/en/docs" target="_blank" rel="noreferrer">Open-Meteo Forecast API</a></span><span>Conditions valid {updatedAt} IST</span></div>
    </>}
  </div>
}
const monthlyDemoSales = [
  { month: 'Jan', sales: 20100 }, { month: 'Feb', sales: 21400 }, { month: 'Mar', sales: 22200 },
  { month: 'Apr', sales: 21800 }, { month: 'May', sales: 23500 }, { month: 'Jun', sales: 22900 },
  { month: 'Jul', sales: 24400 }, { month: 'Aug', sales: 23800 }, { month: 'Sep', sales: 24600 },
  { month: 'Oct', sales: 25100 }, { month: 'Nov', sales: 25500 }, { month: 'Dec', sales: 29300 },
]

const demoSalesTotal = monthlyDemoSales.reduce((total, month) => total + month.sales, 0)

function getDemoTrendPoints(width: number, height: number) {
  const values = monthlyDemoSales.map(({ sales }) => sales)
  const min = Math.min(...values)
  const max = Math.max(...values)
  return values.map((value, index) => {
    const x = (index / (values.length - 1)) * width
    const y = height - 5 - ((value - min) / (max - min)) * (height - 10)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
}

function HeroDashboard() {
  const linePoints = getDemoTrendPoints(220, 70)
  const accessibleSales = monthlyDemoSales.map(({ month, sales }) => `${month} $${(sales / 1000).toFixed(1)} thousand`).join(', ')

  return <div className="hero-visual hero-dashboard">
    <div className="hero-dashboard-header"><div><span className="hero-dashboard-kicker">PORTFOLIO PREVIEW</span><h2>Analytics Overview</h2></div><span className="demo-badge"><i/> DEMO DATA</span></div>
    <div className="hero-kpis">
      <article><span>Total Sales</span><b>${(demoSalesTotal / 1000).toFixed(1)}K</b></article>
      <article><span>Orders</span><b>3,842</b></article>
      <article><span>Growth</span><b>+8.4%</b></article>
    </div>
    <div className="hero-charts">
      <figure className="hero-chart-card"><figcaption><b>Monthly Sales</b><span>USD · Demo</span></figcaption><div className="hero-bar-chart" role="img" aria-label={`Monthly sales in demo data: ${accessibleSales}`}>
        {monthlyDemoSales.map(({ month, sales }, index) => <div className="hero-bar-column" key={month}><i style={{ height: `${(sales / 30000) * 100}%` }}/><span>{index % 2 === 0 ? month : ""}</span></div>)}
      </div></figure>
      <figure className="hero-chart-card"><figcaption><b>Sales Trend</b><span>Jan–Dec · Demo</span></figcaption><div className="hero-line-chart"><svg viewBox="0 0 220 80" role="img" aria-label="Illustrative monthly sales trend line"><line x1="0" y1="10" x2="220" y2="10"/><line x1="0" y1="40" x2="220" y2="40"/><line x1="0" y1="70" x2="220" y2="70"/><polyline points={linePoints}/></svg><div className="hero-line-labels"><span>JAN</span><span>JUN</span><span>DEC</span></div></div></figure>
    </div>
  </div>
}
function App() {
  const [menuOpen,setMenuOpen]=useState(false)
  return <><header className="header"><a href="#home" className="wordmark" aria-label="V. Karthick home"><span className="logo-mark">K<span>.</span></span><span>V. Karthick<small>DATA ANALYTICS</small></span></a><button className="menu-toggle" aria-label={menuOpen?'Close navigation':'Open navigation'} aria-expanded={menuOpen} onClick={()=>setMenuOpen(!menuOpen)}>{menuOpen?<X/>:<Menu/>}</button><nav className={menuOpen?'nav nav-open':'nav'} aria-label="Main navigation">{nav.map(([label,id])=><a href={`#${id}`} key={id} onClick={()=>setMenuOpen(false)}>{label}</a>)}<a href="#contact" className="nav-cta" onClick={()=>setMenuOpen(false)}>Let's talk <ArrowUpRight size={14}/></a></nav></header>
  <main id="home"><section className="hero wrap"><div className="hero-copy"><div className="availability"><span/> OPEN TO DATA ANALYST OPPORTUNITIES</div><h1>Turning data into<br/><span>clear direction.</span></h1><p className="hero-role">Aspiring Data Analyst</p><p className="hero-title">Excel · SQL · Power BI · Python · MySQL</p><p className="hero-intro">I'm V. Karthick, a Computer Science student building practical skills in data analysis, visualization, and reporting. I enjoy exploring datasets, identifying patterns, and turning information into clear, useful insights.</p><div className="hero-actions"><a className="button button-dark" href="#projects">View Projects <ArrowRight size={16}/></a><a className="button button-light" href="/resume.pdf" target="_blank" rel="noreferrer">View Resume <ExternalLink size={15}/></a><a className="text-link" href="#contact">Contact Me <ArrowDownRight size={16}/></a></div></div><HeroDashboard/></section>
        <section className="section wrap about" id="about"><div className="section-label"><span>01</span> ABOUT</div><div className="about-content"><h2>Building practical<br/><span>analyst skills.</span></h2><div className="about-summary"><p>I'm pursuing a B.Sc. in Computer Science at Srimad Andavan Arts and Science College. I'm developing my skills in Excel, SQL, Power BI, and Python to explore data, identify meaningful patterns, and communicate findings clearly. I'm looking for an entry-level Data Analyst opportunity where I can apply my knowledge, learn from real-world challenges, and grow as an analyst.</p></div>
    </div></section>
    <section className="section skills-section" id="skills"><div className="wrap"><div className="section-label"><span>02</span> SKILLS</div><div className="section-heading"><div><span className="eyebrow">Tools for the work</span><h2>Skills I'm building with.</h2></div></div><div className="skills-grid"><article className="skill-card"><span className="skill-number">01</span><span className="skill-icon"><Table2/></span><h3>Data Analysis</h3><p>Use Excel and Python to explore datasets and identify patterns.</p><div className="tags"><span>Excel</span><span>Python</span></div></article><article className="skill-card"><span className="skill-number">02</span><span className="skill-icon"><BarChart3/></span><h3>Data Visualization</h3><p>Use Power BI to communicate trends and comparisons clearly.</p><div className="tags"><span>Power BI</span><span>Dashboards</span><span>Visualization</span><span>Reporting</span></div></article><article className="skill-card"><span className="skill-number">03</span><span className="skill-icon"><Database/></span><h3>Databases</h3><p>Use SQL queries and aggregations to answer focused questions.</p><div className="tags"><span>SQL</span><span>MySQL</span><span>Queries</span></div></article><article className="skill-card"><span className="skill-number">04</span><span className="skill-icon"><FileText/></span><h3>Additional Skills</h3><p>NLP and classification tools listed in the project.</p><div className="tags"><span>Flask</span><span>NLP</span><span>TF-IDF</span><span>Naive Bayes</span><span>Logistic Regression</span></div></article></div></div></section>
    <section className="section wrap experience" id="experience"><div className="section-label"><span>03</span> EXPERIENCE</div><article className="experience-card"><div className="experience-main"><div className="company-mark">V<span>.</span></div><div><span className="role-type">INTERNSHIP</span><h3>Data Analytics Intern</h3><p>VDart Academy</p></div></div><p className="experience-description">Completed data analytics training with hands-on practice in Excel, Power BI, SQL, and Python, applying analytical concepts through practical projects and exercises.</p><ul className="experience-points"><li>Cleaned, organized, and prepared datasets for analysis.</li><li>Used Excel, SQL, and Python in practical analysis exercises.</li><li>Created Power BI visualizations and reports to communicate insights.</li><li>Applied analytical concepts through hands-on training projects.</li><li>Practiced problem-solving and presenting findings clearly.</li></ul><div className="tags experience-tags" aria-label="Skills used"><span>Excel</span><span>Power BI</span><span>SQL</span><span>Python</span></div></article></section>
    <section className="section project-section" id="projects"><div className="wrap"><div className="section-label"><span>04</span> PROJECTS</div><div className="section-heading"><div><h2>Data analytics projects.</h2></div><p>An interactive weather preview and two analytics projects in development.</p></div><div className="projects-grid analytics-projects">
      <article className="project-card weather-project"><div className="project-info weather-project-info"><div><span className="project-type">LIVE WEATHER DATA</span><h3>Live Tamil Nadu Weather Report</h3><p>Current conditions and a five-day forecast for selected Tamil Nadu locations, with temperature, humidity, wind, and precipitation visualization.</p><div className="project-meta"><span><b>Technologies</b>React · TypeScript · REST API</span><span><b>Data source</b>Open-Meteo Forecast API</span></div></div><span className="project-status">Interactive data preview</span></div><WeatherDashboard/></article>
      <article className="project-card development-project"><div className="project-info"><div><span className="project-type">IN DEVELOPMENT</span><h3>Medicine Distribution Analysis</h3><p>Planned analysis of a suitable medicine distribution or transportation dataset to rank the top 20 records, identify trends, and examine delivery performance where the available data supports it.</p></div><span className="project-status">In development</span></div></article>
      <article className="project-card development-project"><div className="project-info"><div><span className="project-type">IN DEVELOPMENT</span><h3>Weekly Healthcare Data Analysis Dashboard</h3><p>Planned dashboard for exploring weekly healthcare data, trends, and key metrics. Analysis will depend on a reliable, appropriate data source; no medical records or results are shown.</p></div><span className="project-status">In development</span></div></article>
    </div></div></section>    <section className="section wrap education" id="education"><div className="section-label"><span>05</span> EDUCATION</div><article className="education-card"><div className="education-icon"><FileText size={21}/></div><div className="education-info"><span>UNDERGRADUATE DEGREE</span><h3>B.Sc. Computer Science</h3><p>Srimad Andavan Arts and Science College</p><small>Thiruvanaikoil, Trichy</small></div><div className="education-year">2023–2026</div></article></section>
    <section className="contact-section" id="contact"><div className="wrap contact-inner"><div className="section-label"><span>06</span> CONTACT</div><div className="contact-layout"><div className="contact-copy"><span className="eyebrow">Contact</span><h2>Get in touch.</h2><p>For Data Analyst opportunities, email me or connect with me on LinkedIn.</p></div><aside className="contact-details" aria-label="Contact links"><a className="contact-link" href="mailto:kk1238452@gmail.com" aria-label="Email Karthick at kk1238452@gmail.com"><Mail size={17}/><span>kk1238452@gmail.com</span><ArrowUpRight size={14}/></a><a className="contact-link" href="https://linkedin.com/in/karthick-v-04b33b2a2" target="_blank" rel="noreferrer" aria-label="Open Karthick V LinkedIn profile in a new tab"><Linkedin size={17}/><span>LinkedIn profile</span><ExternalLink size={13}/></a></aside></div><div className="contact-decoration"><BarChart3/></div></div></section>
  </main><footer className="footer"><div className="wrap footer-main"><a href="#home" className="wordmark"><span className="logo-mark">K<span>.</span></span><span>V. Karthick<small>DATA ANALYTICS</small></span></a><nav aria-label="Footer navigation">{nav.map(([label,id])=><a href={`#${id}`} key={id}>{label}</a>)}</nav></div><div className="wrap footer-bottom"><span>© {new Date().getFullYear()} V. Karthick</span><a href="#home">Back to top ↑</a></div></footer></>
}
export default App











