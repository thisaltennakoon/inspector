import { useState, useCallback } from "react";
import {
  Play,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Bug,
  Github,
  Eye,
  EyeOff,
  RotateCcw,
  Settings,
  HelpCircle,
  RefreshCwOff,
  Copy,
  CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StdErrNotification } from "@/lib/notificationTypes";
import {
  LoggingLevel,
  LoggingLevelSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { InspectorConfig } from "@/lib/configurationTypes";
import { ConnectionStatus } from "@/lib/constants";
import useTheme from "../lib/hooks/useTheme";
import { version } from "../../../package.json";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { useToast } from "../lib/hooks/useToast";

interface SidebarProps {
  connectionStatus: ConnectionStatus;
  transportType: "stdio" | "sse" | "streamable-http";
  setTransportType: (type: "stdio" | "sse" | "streamable-http") => void;
  command: string;
  setCommand: (command: string) => void;
  args: string;
  setArgs: (args: string) => void;
  sseUrl: string;
  setSseUrl: (url: string) => void;
  env: Record<string, string>;
  setEnv: (env: Record<string, string>) => void;
  bearerToken: string;
  setBearerToken: (token: string) => void;
  headerName?: string;
  setHeaderName?: (name: string) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  stdErrNotifications: StdErrNotification[];
  clearStdErrNotifications: () => void;
  logLevel: LoggingLevel;
  sendLogLevelRequest: (level: LoggingLevel) => void;
  loggingSupported: boolean;
  config: InspectorConfig;
  setConfig: (config: InspectorConfig) => void;
}

const Sidebar = ({
  connectionStatus,
  transportType,
  setTransportType,
  command,
  setCommand,
  args,
  setArgs,
  sseUrl,
  setSseUrl,
  env,
  setEnv,
  bearerToken,
  setBearerToken,
  headerName,
  setHeaderName,
  onConnect,
  onDisconnect,
  stdErrNotifications,
  clearStdErrNotifications,
  logLevel,
  sendLogLevelRequest,
  loggingSupported,
  config,
  setConfig,
}: SidebarProps) => {
  const [theme, setTheme] = useTheme();
  const [showEnvVars, setShowEnvVars] = useState(false);
  const [showBearerToken, setShowBearerToken] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [shownEnvVars, setShownEnvVars] = useState<Set<string>>(new Set());
  const [copiedServerEntry, setCopiedServerEntry] = useState(false);
  const [copiedServerFile, setCopiedServerFile] = useState(false);
  const { toast } = useToast();

  // Reusable error reporter for copy actions
  const reportError = useCallback(
    (error: unknown) => {
      toast({
        title: "Error",
        description: `Failed to copy config: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    },
    [toast],
  );

  // Shared utility function to generate server config
  const generateServerConfig = useCallback(() => {
    if (transportType === "stdio") {
      return {
        command,
        args: args.trim() ? args.split(/\s+/) : [],
        env: { ...env },
      };
    }
    if (transportType === "sse") {
      return {
        type: "sse",
        url: sseUrl,
        note: "For SSE connections, add this URL directly in your MCP Client",
      };
    }
    if (transportType === "streamable-http") {
      return {
        type: "streamable-http",
        url: sseUrl,
        note: "For Streamable HTTP connections, add this URL directly in your MCP Client",
      };
    }
    return {};
  }, [transportType, command, args, env, sseUrl]);

  // Memoized config entry generator
  const generateMCPServerEntry = useCallback(() => {
    return JSON.stringify(generateServerConfig(), null, 4);
  }, [generateServerConfig]);

  // Memoized config file generator
  const generateMCPServerFile = useCallback(() => {
    return JSON.stringify(
      {
        mcpServers: {
          "default-server": generateServerConfig(),
        },
      },
      null,
      4,
    );
  }, [generateServerConfig]);

  // Memoized copy handlers
  const handleCopyServerEntry = useCallback(() => {
    try {
      const configJson = generateMCPServerEntry();
      navigator.clipboard
        .writeText(configJson)
        .then(() => {
          setCopiedServerEntry(true);

          toast({
            title: "Config entry copied",
            description:
              transportType === "stdio"
                ? "Server configuration has been copied to clipboard. Add this to your mcp.json inside the 'mcpServers' object with your preferred server name."
                : "SSE URL has been copied. Use this URL directly in your MCP Client.",
          });

          setTimeout(() => {
            setCopiedServerEntry(false);
          }, 2000);
        })
        .catch((error) => {
          reportError(error);
        });
    } catch (error) {
      reportError(error);
    }
  }, [generateMCPServerEntry, transportType, toast, reportError]);

  const handleCopyServerFile = useCallback(() => {
    try {
      const configJson = generateMCPServerFile();
      navigator.clipboard
        .writeText(configJson)
        .then(() => {
          setCopiedServerFile(true);

          toast({
            title: "Servers file copied",
            description:
              "Servers configuration has been copied to clipboard. Add this to your mcp.json file. Current testing server will be added as 'default-server'",
          });

          setTimeout(() => {
            setCopiedServerFile(false);
          }, 2000);
        })
        .catch((error) => {
          reportError(error);
        });
    } catch (error) {
      reportError(error);
    }
  }, [generateMCPServerFile, toast, reportError]);

  return (
    <div className="w-80 bg-card border-r border-border flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center">
          <h1 className="ml-2 text-lg font-semibold">
            MCP Inspector v{version}
          </h1>
        </div>
      </div>

      <div className="p-4 flex-1 overflow-auto">
        <div className="space-y-4">
          <div className="space-y-2">
            <label
              className="text-sm font-medium"
              htmlFor="transport-type-select"
            >
              Transport Type
            </label>
            <Select
              value={transportType}
              onValueChange={(value: "streamable-http") =>
                setTransportType(value)
              }
            >
              <SelectTrigger id="transport-type-select">
                <SelectValue placeholder="Select transport type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="streamable-http">Streamable HTTP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {transportType === "stdio" ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="command-input">
                  Command
                </label>
                <Input
                  id="command-input"
                  placeholder="Command"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <label
                  className="text-sm font-medium"
                  htmlFor="arguments-input"
                >
                  Arguments
                </label>
                <Input
                  id="arguments-input"
                  placeholder="Arguments (space-separated)"
                  value={args}
                  onChange={(e) => setArgs(e.target.value)}
                  className="font-mono"
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="sse-url-input">
                  URL
                </label>
                <Input
                  id="sse-url-input"
                  placeholder="URL"
                  value={sseUrl}
                  onChange={(e) => setSseUrl(e.target.value)}
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  onClick={() => setShowBearerToken(!showBearerToken)}
                  className="flex items-center w-full"
                  data-testid="auth-button"
                  aria-expanded={showBearerToken}
                >
                  {showBearerToken ? (
                    <ChevronDown className="w-4 h-4 mr-2" />
                  ) : (
                    <ChevronRight className="w-4 h-4 mr-2" />
                  )}
                  Authentication
                </Button>
                {showBearerToken && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Header Name</label>
                    <Input
                      placeholder="Authorization"
                      onChange={(e) =>
                        setHeaderName && setHeaderName(e.target.value)
                      }
                      data-testid="header-input"
                      className="font-mono"
                      value={headerName}
                    />
                    <label
                      className="text-sm font-medium"
                      htmlFor="bearer-token-input"
                    >
                      Bearer Token
                    </label>
                    <Input
                      id="bearer-token-input"
                      placeholder="Bearer Token"
                      value={bearerToken}
                      onChange={(e) => setBearerToken(e.target.value)}
                      data-testid="bearer-token-input"
                      className="font-mono"
                      type="password"
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {transportType === "stdio" && (
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={() => setShowEnvVars(!showEnvVars)}
                className="flex items-center w-full"
                data-testid="env-vars-button"
                aria-expanded={showEnvVars}
              >
                {showEnvVars ? (
                  <ChevronDown className="w-4 h-4 mr-2" />
                ) : (
                  <ChevronRight className="w-4 h-4 mr-2" />
                )}
                Environment Variables
              </Button>
              {showEnvVars && (
                <div className="space-y-2">
                  {Object.entries(env).map(([key, value], idx) => (
                    <div key={idx} className="space-y-2 pb-4">
                      <div className="flex gap-2">
                        <Input
                          aria-label={`Environment variable key ${idx + 1}`}
                          placeholder="Key"
                          value={key}
                          onChange={(e) => {
                            const newKey = e.target.value;
                            const newEnv = Object.entries(env).reduce(
                              (acc, [k, v]) => {
                                if (k === key) {
                                  acc[newKey] = value;
                                } else {
                                  acc[k] = v;
                                }
                                return acc;
                              },
                              {} as Record<string, string>,
                            );
                            setEnv(newEnv);
                            setShownEnvVars((prev) => {
                              const next = new Set(prev);
                              if (next.has(key)) {
                                next.delete(key);
                                next.add(newKey);
                              }
                              return next;
                            });
                          }}
                          className="font-mono"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-9 w-9 p-0 shrink-0"
                          onClick={() => {
                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                            const { [key]: _removed, ...rest } = env;
                            setEnv(rest);
                          }}
                        >
                          ×
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          aria-label={`Environment variable value ${idx + 1}`}
                          type={shownEnvVars.has(key) ? "text" : "password"}
                          placeholder="Value"
                          value={value}
                          onChange={(e) => {
                            const newEnv = { ...env };
                            newEnv[key] = e.target.value;
                            setEnv(newEnv);
                          }}
                          className="font-mono"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 p-0 shrink-0"
                          onClick={() => {
                            setShownEnvVars((prev) => {
                              const next = new Set(prev);
                              if (next.has(key)) {
                                next.delete(key);
                              } else {
                                next.add(key);
                              }
                              return next;
                            });
                          }}
                          aria-label={
                            shownEnvVars.has(key) ? "Hide value" : "Show value"
                          }
                          aria-pressed={shownEnvVars.has(key)}
                          title={
                            shownEnvVars.has(key) ? "Hide value" : "Show value"
                          }
                        >
                          {shownEnvVars.has(key) ? (
                            <Eye className="h-4 w-4" aria-hidden="true" />
                          ) : (
                            <EyeOff className="h-4 w-4" aria-hidden="true" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full mt-2"
                    onClick={() => {
                      const key = "";
                      const newEnv = { ...env };
                      newEnv[key] = "";
                      setEnv(newEnv);
                    }}
                  >
                    Add Environment Variable
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Always show both copy buttons for all transport types */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyServerEntry}
                  className="w-full"
                >
                  {copiedServerEntry ? (
                    <CheckCheck className="h-4 w-4 mr-2" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" />
                  )}
                  Server Entry
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy Server Entry</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyServerFile}
                  className="w-full"
                >
                  {copiedServerFile ? (
                    <CheckCheck className="h-4 w-4 mr-2" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" />
                  )}
                  Servers File
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy Servers File</TooltipContent>
            </Tooltip>
          </div>

          {/* Configuration */}
          <div className="space-y-2">
            <Button
              variant="outline"
              onClick={() => setShowConfig(!showConfig)}
              className="flex items-center w-full"
              data-testid="config-button"
              aria-expanded={showConfig}
            >
              {showConfig ? (
                <ChevronDown className="w-4 h-4 mr-2" />
              ) : (
                <ChevronRight className="w-4 h-4 mr-2" />
              )}
              <Settings className="w-4 h-4 mr-2" />
              Configuration
            </Button>
            {showConfig && (
              <div className="space-y-2">
                {Object.entries(config).map(([key, configItem]) => {
                  const configKey = key as keyof InspectorConfig;
                  return (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center gap-1">
                        <label
                          className="text-sm font-medium text-green-600 break-all"
                          htmlFor={`${configKey}-input`}
                        >
                          {configItem.label}
                        </label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            {configItem.description}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      {typeof configItem.value === "number" ? (
                        <Input
                          id={`${configKey}-input`}
                          type="number"
                          data-testid={`${configKey}-input`}
                          value={configItem.value}
                          onChange={(e) => {
                            const newConfig = { ...config };
                            newConfig[configKey] = {
                              ...configItem,
                              value: Number(e.target.value),
                            };
                            setConfig(newConfig);
                          }}
                          className="font-mono"
                        />
                      ) : typeof configItem.value === "boolean" ? (
                        <Select
                          data-testid={`${configKey}-select`}
                          value={configItem.value.toString()}
                          onValueChange={(val) => {
                            const newConfig = { ...config };
                            newConfig[configKey] = {
                              ...configItem,
                              value: val === "true",
                            };
                            setConfig(newConfig);
                          }}
                        >
                          <SelectTrigger id={`${configKey}-input`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">True</SelectItem>
                            <SelectItem value="false">False</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id={`${configKey}-input`}
                          data-testid={`${configKey}-input`}
                          value={configItem.value}
                          onChange={(e) => {
                            const newConfig = { ...config };
                            newConfig[configKey] = {
                              ...configItem,
                              value: e.target.value,
                            };
                            setConfig(newConfig);
                          }}
                          className="font-mono"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-2">
            {connectionStatus === "connected" && (
              <div className="grid grid-cols-2 gap-4">
                <Button
                  data-testid="connect-button"
                  onClick={() => {
                    onDisconnect();
                    onConnect();
                  }}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  {transportType === "stdio" ? "Restart" : "Reconnect"}
                </Button>
                <Button onClick={onDisconnect}>
                  <RefreshCwOff className="w-4 h-4 mr-2" />
                  Disconnect
                </Button>
              </div>
            )}
            {connectionStatus !== "connected" && (
              <Button className="w-full" onClick={onConnect}>
                <Play className="w-4 h-4 mr-2" />
                Connect
              </Button>
            )}

            <div className="flex items-center justify-center space-x-2 mb-4">
              <div
                className={`w-2 h-2 rounded-full ${(() => {
                  switch (connectionStatus) {
                    case "connected":
                      return "bg-green-500";
                    case "error":
                      return "bg-red-500";
                    case "error-connecting-to-proxy":
                      return "bg-red-500";
                    default:
                      return "bg-gray-500";
                  }
                })()}`}
              />
              <span className="text-sm text-gray-600">
                {(() => {
                  switch (connectionStatus) {
                    case "connected":
                      return "Connected";
                    case "error":
                      return "Connection Error, is your MCP server running?";
                    case "error-connecting-to-proxy":
                      return "Error Connecting to MCP Inspector Proxy - Check Console logs";
                    default:
                      return "Disconnected";
                  }
                })()}
              </span>
            </div>

            {loggingSupported && connectionStatus === "connected" && (
              <div className="space-y-2">
                <label
                  className="text-sm font-medium"
                  htmlFor="logging-level-select"
                >
                  Logging Level
                </label>
                <Select
                  value={logLevel}
                  onValueChange={(value: LoggingLevel) =>
                    sendLogLevelRequest(value)
                  }
                >
                  <SelectTrigger id="logging-level-select">
                    <SelectValue placeholder="Select logging level" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(LoggingLevelSchema.enum).map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {stdErrNotifications.length > 0 && (
              <>
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium">
                      Error output from MCP server
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearStdErrNotifications}
                      className="h-8 px-2"
                    >
                      Clear
                    </Button>
                  </div>
                  <div className="mt-2 max-h-80 overflow-y-auto">
                    {stdErrNotifications.map((notification, index) => (
                      <div
                        key={index}
                        className="text-sm text-red-500 font-mono py-2 border-b border-gray-200 last:border-b-0"
                      >
                        {notification.params.content}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
