/*
Author:Weiho
Time:2018-05-05 18:17
https://github.com/zhaoweiho
*/
<script>
var targetProtocol = "https:";
if (window.location.protocol != targetProtocol)
window.location.href = targetProtocol +
window.location.href.substring(window.location.protocol.length);
</script>