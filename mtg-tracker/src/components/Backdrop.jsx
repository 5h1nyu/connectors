import RingInscription from './RingInscription'

// The slow, hypnotic rings of writing behind every page.
export default function Backdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <RingInscription
        size={1000}
        rings={[
          { r: 470, fontSize: 30, speed: 420, repeat: 4 },
          { r: 395, fontSize: 26, speed: -360, repeat: 4 },
          { r: 325, fontSize: 22, speed: 300, repeat: 3 },
          { r: 260, fontSize: 19, speed: -240, repeat: 3 },
          { r: 200, fontSize: 16, speed: 200, repeat: 2 },
          { r: 145, fontSize: 13, speed: -160, repeat: 2 },
        ]}
      />
    </div>
  )
}
