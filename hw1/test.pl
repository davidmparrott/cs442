#!/usr/bin/perl

use strict;

my $OUTDIR = "results";
mkdir $OUTDIR unless -d $OUTDIR;

sub exe {
    my $cmd = shift;
    print "$cmd\n";
    system($cmd) == 0 or die "$!\n";
}

my @POLYS = (
    "box",
    "triangle",
    "box-hole",
    "donut",
    "star",
    "bunch",
    "argyle",
    "wsu-logo",
    "perspectivesquare"
    );

my @STYLES = ("yellow", "depth", "color", "checker", "mandrill");

foreach my $style (@STYLES) {
    foreach my $poly (@POLYS) {
	next if -f "$OUTDIR/$poly-$style.png";
	exe "node polyfilltest.js $style $poly.json | convert - $OUTDIR/$poly-$style.png";
	exe "convert $OUTDIR/$poly-$style.png -thumbnail 100x100 $OUTDIR/$poly-$style-thumb.png";
    }
}

my $title = "Polyfill Results";

open (my $fh, ">$OUTDIR/results.html") or die "$!\n";

print $fh <<"EOH";
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>$title</title>
<style>
body {
  font-family: "Lucida Sans Unicode", "Lucida Grande", sans-serif
}
h1 {
    font-size: 1.2em;
}
</style>
</head>
<body>
<h1>$title</h1>
<table>
EOH

print $fh "<thead><tr>\n";
print $fh "<td></td>\n";
foreach my $poly (@POLYS) {
    print $fh "<th scopre=\"col\">$poly</a></th>\n";
}
print $fh "</thead></tr>\n";

print $fh "<tbody>\n";
foreach my $style (@STYLES) {
    print $fh "<tr>\n";
    print $fh "<th scope=\"row\">$style</th>\n";
    foreach my $poly (@POLYS) {
	print $fh    "<td><a href=\"$poly-$style.png\"><img src=\"$poly-$style-thumb.png\"/></a></td>\n";
    }
    print $fh "</tr>\n";
}
print $fh "</tbody></table>\n";

#my @timeData = localtime(time);
#print $fh "<p>@timeData</p>\n";

my @months = qw( January February March April May June 
                  July August September October November December );
my @days = qw(Sunday Monday Tuesday Wednesday Thursday Friday Saturday Sunday);
my ($sec,$min,$hour,$mday,$mon,$year,$wday,$yday,$isdst) = localtime();
$year += 1900;
print $fh "<p><em>$hour:$min:$sec $days[$wday], $months[$mon] $mday, $year</em></p>\n";

print $fh <<"EOT";
</table>
</body>
</html>
EOT

close $fh
