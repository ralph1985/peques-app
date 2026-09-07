import type { SettingsInput, SettingsRepository } from "../application/settings-repository";
import { healthRegions, isTutorialRoute, type NextAppointment } from "../domain/settings";
import type { PequesDatabase } from "@/shared/infrastructure/local/database";
import { assert, isTimestamp } from "@/shared/domain/validation";

export class DexieSettingsRepository implements SettingsRepository {
  constructor(private readonly db: PequesDatabase) {}
  async read() {
    const settings = await this.db.settings.get("main");
    assert(settings, "No se pudo leer la configuración local.");
    return {
      ...settings,
      tutorialSeenRoutes: settings.tutorialSeenRoutes ?? [],
      tutorialReplayRequested: settings.tutorialReplayRequested ?? false,
      healthRegion: settings.healthRegion ?? "madrid",
      nextAppointment: settings.nextAppointment ?? null,
      consultationQuestions: settings.consultationQuestions ?? [],
    };
  }
  async update(input: Partial<SettingsInput>) {
    const patch: Partial<SettingsInput> = {};
    if (input.travelView !== undefined) {
      assert(["prepare", "location"].includes(input.travelView), "Vista de viaje no válida.");
      patch.travelView = input.travelView;
    }
    if (input.vaccineView !== undefined) {
      assert(["status", "timeline"].includes(input.vaccineView), "Vista de vacunas no válida.");
      patch.vaccineView = input.vaccineView;
    }
    if (input.calendarAllChildren !== undefined) {
      assert(typeof input.calendarAllChildren === "boolean", "Vista de calendario no válida.");
      patch.calendarAllChildren = input.calendarAllChildren;
    }
    if (input.healthRegion !== undefined) {
      assert(healthRegions.includes(input.healthRegion), "Comunidad sanitaria no válida.");
      patch.healthRegion = input.healthRegion;
    }
    if (input.nextAppointment !== undefined) {
      if (input.nextAppointment !== null) {
        assert(/^\d{4}-\d{2}-\d{2}$/.test(input.nextAppointment.date), "Fecha de cita no válida.");
        assert(
          input.nextAppointment.title.trim().length > 0,
          "El título de la cita es obligatorio.",
        );
        assert(
          input.nextAppointment.place.trim().length > 0,
          "El lugar de la cita es obligatorio.",
        );
      }
      patch.nextAppointment = input.nextAppointment;
    }
    if (input.consultationQuestions !== undefined) {
      assert(
        Array.isArray(input.consultationQuestions) &&
          input.consultationQuestions.every(
            (question) =>
              typeof question.id === "string" &&
              typeof question.text === "string" &&
              question.text.trim().length > 0 &&
              typeof question.createdAt === "string" &&
              typeof question.completed === "boolean",
          ),
        "Preguntas de consulta no válidas.",
      );
      patch.consultationQuestions = input.consultationQuestions;
    }
    if (input.tutorialSeenRoutes !== undefined) {
      assert(
        Array.isArray(input.tutorialSeenRoutes) && input.tutorialSeenRoutes.every(isTutorialRoute),
        "Rutas del tutorial no válidas.",
      );
      patch.tutorialSeenRoutes = [...new Set(input.tutorialSeenRoutes)];
    }
    if (input.tutorialReplayRequested !== undefined) {
      assert(typeof input.tutorialReplayRequested === "boolean", "Estado del tutorial no válido.");
      patch.tutorialReplayRequested = input.tutorialReplayRequested;
    }
    await this.db.transaction("rw", this.db.settings, async () => {
      await this.read();
      await this.db.settings.update("main", patch);
    });
  }
  async recordExport(timestamp: string) {
    assert(isTimestamp(timestamp), "Fecha de exportación no válida.");
    await this.db.transaction("rw", this.db.settings, async () => {
      await this.read();
      await this.db.settings.update("main", { lastExportedAt: timestamp });
    });
  }

  async updateAppointment(appointment: NextAppointment | null) {
    await this.update({ nextAppointment: appointment });
  }

  async addConsultationQuestion(text: string) {
    const value = text.trim();
    assert(value.length > 0 && value.length <= 4000, "La pregunta no puede estar vacía.");
    const question = {
      id: crypto.randomUUID(),
      text: value,
      createdAt: new Date().toISOString(),
      completed: false,
    } as const;
    const settings = await this.read();
    await this.update({ consultationQuestions: [...settings.consultationQuestions, question] });
    return question;
  }

  async toggleConsultationQuestion(id: string, completed: boolean) {
    const settings = await this.read();
    const questions = settings.consultationQuestions.map((question) =>
      question.id === id ? { ...question, completed } : question,
    );
    assert(
      questions.some((question) => question.id === id),
      "La pregunta no existe.",
    );
    await this.update({ consultationQuestions: questions });
  }

  async deleteConsultationQuestion(id: string) {
    const settings = await this.read();
    await this.update({
      consultationQuestions: settings.consultationQuestions.filter(
        (question) => question.id !== id,
      ),
    });
  }
}
