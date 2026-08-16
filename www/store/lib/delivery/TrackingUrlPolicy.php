<?php
declare(strict_types=1);
final class TrackingUrlPolicy
{
 /** @param array<string,string> $carrierOrigins */ public function __construct(private readonly array $carrierOrigins){}
 public function isSafe(string $carrierCode,?string $url):bool
 {
  if($url===null||$url==='')return true;if(!isset($this->carrierOrigins[$carrierCode])||filter_var($url,FILTER_VALIDATE_URL)===false)return false;
  if(strlen($url)>2048)return false;$expected=parse_url($this->carrierOrigins[$carrierCode]);$actual=parse_url($url);return ($actual['scheme']??'')==='https'&&strcasecmp((string)($actual['host']??''),(string)($expected['host']??''))===0&&!isset($actual['user'])&&!isset($actual['pass'])&&(!isset($actual['port'])||(int)$actual['port']===443);
 }
}
