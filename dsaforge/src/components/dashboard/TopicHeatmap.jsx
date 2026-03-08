import { TOPICS } from "../../data/topics"

export default function TopicHeatmap(){

  return(

    <div>

      <h3>Topic Performance</h3>

      {TOPICS.map((topic)=>(

        <div key={topic.name} className="topic-row">

          <span>{topic.name}</span>

          <div className="progress">

            <div
              className="bar"
              style={{width:`${topic.pct}%`}}
            />

          </div>

          <span>{topic.pct}%</span>

        </div>

      ))}

    </div>

  )

}