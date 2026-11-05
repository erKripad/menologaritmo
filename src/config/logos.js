// Tutti i loghi del sito, in un solo posto.
// Finché un valore è null, al suo posto viene mostrato un segnaposto.
//
// Per inserire un logo:
// 1. metti il file in src/assets/logos/ (meglio .svg)
// 2. importalo qui, ad esempio:  import radici from '../assets/logos/radici.svg'
// 3. sostituisci null con il nome importato:  radici: radici
import menologaritmo from '../assets/logos/menologaritmo.svg'
import radici from '../assets/logos/radici.svg'
import addettiAiLavori from '../assets/logos/addetti-ai-lavori.svg'

const logos = {
  menologaritmo,
  radici,
  addettiAiLavori,
}

export default logos
