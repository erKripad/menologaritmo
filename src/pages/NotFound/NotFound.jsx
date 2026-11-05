import ErrorPage from '../../components/ErrorPage/ErrorPage.jsx'
import Button from '../../components/Button/Button.jsx'

export default function NotFound() {
  return (
    <>
      <title>Pagina non trovata · menologaritmo</title>
      <meta name="robots" content="noindex" />
      <ErrorPage
        code="Errore 404"
        title="Pagina non trovata."
        message="La pagina che cerchi non esiste o è stata spostata."
      >
        <Button to="/">Torna alla home</Button>
      </ErrorPage>
    </>
  )
}
