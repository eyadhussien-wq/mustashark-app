import type { AgendaReadModel } from "../lib/agenda/agendaTypes";
import { formatAgendaTime } from "../lib/agenda/agendaPresentation";

type AgendaListProps = {
  model: AgendaReadModel;
};

export function AgendaList({ model }: AgendaListProps) {
  return (
    <div>
      {model.days.map((day) => (
        <section key={day.dateKey}>
          <h2>{day.dateKey}</h2>
          {day.items.map((item) => (
            <article key={item.bookingId}>
              <strong>{formatAgendaTime(item.startsAtUtc, model.timezone)}</strong>
              <div>{item.subject}</div>
              <small>{item.type}</small>
            </article>
          ))}
        </section>
      ))}
    </div>
  );
}
