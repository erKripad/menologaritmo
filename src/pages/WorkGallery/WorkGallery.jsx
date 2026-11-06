import { Link, useParams } from 'react-router'
import Section from '../../components/Section/Section.jsx'
import Reveal from '../../components/Reveal/Reveal.jsx'
import Button from '../../components/Button/Button.jsx'
import ErrorPage from '../../components/ErrorPage/ErrorPage.jsx'
import PhotoColumns from './components/PhotoColumns/PhotoColumns.jsx'
import useWorkGallery from './useWorkGallery.js'
import './WorkGallery.css'

const HOME_RECENT_WORKS = { pathname: '/' }
const HOME_STATE = { scrollTo: 'lavori-recenti' }

const LOADING_PHOTOS = [
  [3, 2],
  [2, 3],
  [1, 1],
  [2, 3],
  [3, 2],
  [3, 2],
].map(([width, height], index) => ({ id: `loading-${index}`, image: null, width, height }))

function BackToHome() {
  return (
    <Link to={HOME_RECENT_WORKS} state={HOME_STATE} className="work-gallery__back">
      Torna alla home
    </Link>
  )
}

// Galleria di un evento: informazioni in alto, foto su tre colonne
export default function WorkGallery() {
  const { slug } = useParams()
  const gallery = useWorkGallery(slug)

  if (gallery.status === 'not-found' || gallery.status === 'error') {
    const notFound = gallery.status === 'not-found'
    return (
      <>
        <title>{`${notFound ? 'Evento non trovato' : 'Foto non disponibili'} · menologaritmo`}</title>
        <meta name="robots" content="noindex" />
        <ErrorPage
          code={notFound ? 'Errore 404' : 'Errore di connessione'}
          title={notFound ? 'Evento non trovato.' : 'Foto non disponibili.'}
          message={
            notFound
              ? "L'evento che cerchi non c'è più o il link è sbagliato."
              : 'Non riusciamo a caricare le foto in questo momento. Riprova tra poco.'
          }
        >
          <Button to={HOME_RECENT_WORKS} state={HOME_STATE}>
            Torna alla home
          </Button>
        </ErrorPage>
      </>
    )
  }

  const loading = gallery.status === 'loading'
  const { work, photos } = loading ? { work: null, photos: LOADING_PHOTOS } : gallery

  return (
    <Section className="work-gallery" centered={false} aria-labelledby="work-gallery-title" aria-busy={loading}>
      {work && <title>{`${work.artist} · menologaritmo`}</title>}

      <header className="work-gallery__header">
        <Reveal>
          <BackToHome />
        </Reveal>
        <Reveal as="h1" id="work-gallery-title" className="title-section work-gallery__title" delay={100}>
          {work ? work.artist : '\u00a0'}
        </Reveal>
        <Reveal as="p" className="work-gallery__meta" delay={150}>
          {work ? `${work.date} · ${work.venue}` : '\u00a0'}
        </Reveal>
      </header>

      <PhotoColumns photos={photos} label={work ? `${work.artist}, ${work.venue}` : 'Foto in caricamento'} />
    </Section>
  )
}
