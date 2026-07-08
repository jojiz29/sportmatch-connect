import { Injectable, Logger, NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

@Injectable()
export class ObservabilityService extends Logger {
  private readonly isProduction = process.env.NODE_ENV === "production";

  log(message: string, context?: string) {
    if (this.isProduction) {
      console.log(
        JSON.stringify({ level: "info", message, context, timestamp: new Date().toISOString() }),
      );
    } else {
      super.log(message, context);
    }
  }

  error(message: string, trace?: string, context?: string) {
    if (this.isProduction) {
      console.error(
        JSON.stringify({
          level: "error",
          message,
          trace,
          context,
          timestamp: new Date().toISOString(),
        }),
      );
    } else {
      super.error(message, trace, context);
    }
  }

  warn(message: string, context?: string) {
    if (this.isProduction) {
      console.warn(
        JSON.stringify({ level: "warn", message, context, timestamp: new Date().toISOString() }),
      );
    } else {
      super.warn(message, context);
    }
  }

  // APM OpenTelemetry / Sentry manual tracking stubs
  captureException(exception: unknown, context?: string) {
    const err = exception instanceof Error ? exception : new Error(String(exception));
    this.error(`Captured Exception: ${err.message}`, err.stack, context);
  }

  trackPerformance(metricName: string, durationMs: number) {
    this.log(`APM Metric [${metricName}]: ${durationMs}ms`);
    if (durationMs > 200) {
      this.warn(`Performance Warning: ${metricName} exceeded threshold of 200ms (${durationMs}ms)`);
    }
  }
}

@Injectable()
export class ObservabilityInterceptor implements NestInterceptor {
  constructor(private readonly observabilityService: ObservabilityService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - now;
        this.observabilityService.trackPerformance(`${method} ${url}`, duration);
      }),
    );
  }
}
