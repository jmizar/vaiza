// GENERATED: square flags (flag-icons, MIT) for every country in src/data. Re-generate when adding countries.

import ad from 'flag-icons/flags/1x1/ad.svg'
import ar from 'flag-icons/flags/1x1/ar.svg'
import at from 'flag-icons/flags/1x1/at.svg'
import be from 'flag-icons/flags/1x1/be.svg'
import ca from 'flag-icons/flags/1x1/ca.svg'
import ch from 'flag-icons/flags/1x1/ch.svg'
import cz from 'flag-icons/flags/1x1/cz.svg'
import de from 'flag-icons/flags/1x1/de.svg'
import dk from 'flag-icons/flags/1x1/dk.svg'
import ee from 'flag-icons/flags/1x1/ee.svg'
import es from 'flag-icons/flags/1x1/es.svg'
import fr from 'flag-icons/flags/1x1/fr.svg'
import gb from 'flag-icons/flags/1x1/gb.svg'
import gr from 'flag-icons/flags/1x1/gr.svg'
import hr from 'flag-icons/flags/1x1/hr.svg'
import hu from 'flag-icons/flags/1x1/hu.svg'
import id from 'flag-icons/flags/1x1/id.svg'
import ie from 'flag-icons/flags/1x1/ie.svg'
import is from 'flag-icons/flags/1x1/is.svg'
import it from 'flag-icons/flags/1x1/it.svg'
import jp from 'flag-icons/flags/1x1/jp.svg'
import ma from 'flag-icons/flags/1x1/ma.svg'
import mx from 'flag-icons/flags/1x1/mx.svg'
import nl from 'flag-icons/flags/1x1/nl.svg'
import no from 'flag-icons/flags/1x1/no.svg'
import pl from 'flag-icons/flags/1x1/pl.svg'
import pt from 'flag-icons/flags/1x1/pt.svg'
import se from 'flag-icons/flags/1x1/se.svg'
import th from 'flag-icons/flags/1x1/th.svg'
import tr from 'flag-icons/flags/1x1/tr.svg'
import us from 'flag-icons/flags/1x1/us.svg'

const FLAGS: Record<string, string> = {
  AD: ad,
  AR: ar,
  AT: at,
  BE: be,
  CA: ca,
  CH: ch,
  CZ: cz,
  DE: de,
  DK: dk,
  EE: ee,
  ES: es,
  FR: fr,
  GB: gb,
  GR: gr,
  HR: hr,
  HU: hu,
  ID: id,
  IE: ie,
  IS: is,
  IT: it,
  JP: jp,
  MA: ma,
  MX: mx,
  NL: nl,
  NO: no,
  PL: pl,
  PT: pt,
  SE: se,
  TH: th,
  TR: tr,
  US: us,
}

export function flagUrl(countryCode: string): string {
  return FLAGS[countryCode.toUpperCase()] ?? ''
}
