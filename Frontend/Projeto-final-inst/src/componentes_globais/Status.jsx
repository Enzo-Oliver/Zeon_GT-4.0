import { useState, useEffect } from 'react'

const URL_API = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function lerVistos() {
  try {
    return JSON.parse(localStorage.getItem('storiesVistos')) || []
  } catch {
    return []
  }
}

function Status() {
  const [stories, setStories] = useState([])
  const [vistos, setVistos] = useState(lerVistos())

  useEffect(() => {
    fetch(`${URL_API}/stories`)
      .then((r) => r.json())
      .then((dados) => setStories(dados))
  }, [])

  function abrir(id) {
    if (vistos.includes(id)) return
    const novos = [...vistos, id]
    setVistos(novos)
    localStorage.setItem('storiesVistos', JSON.stringify(novos))
  }

  return (
    <div className="stories">
      {stories.map((story) => (
        <button
          type="button"
          key={story.id}
          className="story"
          onClick={() => abrir(story.id)}
        >
          <span className={vistos.includes(story.id) ? 'story-anel visto' : 'story-anel'}>
            <img src={story.img} alt={story.name} />
          </span>
          <span className="story-nome">{story.name}</span>
        </button>
      ))}
    </div>
  )
}

export default Status
